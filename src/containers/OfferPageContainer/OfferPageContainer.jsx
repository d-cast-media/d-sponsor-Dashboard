import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import Meta from "../../components/Meta";
import { ethers } from "ethers";
import Image from "next/image";
import { useContract, useContractWrite, useContractRead, useAddress } from "@thirdweb-dev/react";
import Tippy from "@tippyjs/react";

import OfferSkeleton from "../../components/skeleton/offerSkeleton";
import { fetchAllOffers } from "../../providers/methods/fetchAllOffers";
import Integration from "../../components/offer-section/integration";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import ExclamationCircleIcon from "@heroicons/react/24/solid";
import InfoIcon from "../../components/informations/infoIcon";

import { fetchOffer } from "../../providers/methods/fetchOffer";

import Form from "../../components/collections-wide/sidebar/collections/Form";
import "tippy.js/dist/tippy.css";
import Validation from "../../components/offer-section/validation";
import ModalHelper from "../../components/Helper/modalHelper";
import { ItemsTabs } from "../../components/component";
import config from "../../config/config";
import { useSwitchChainContext } from "../../contexts/hooks/useSwitchChainContext";
import { activated_features } from "../../data/activated_features";
import UpdateOffer from "../../components/offer-section/updateOffer";
import ChangeMintPrice from "../../components/offer-section/changeMintPrice";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import formatAndRoundPrice from "../../utils/formatAndRound";
import Disable from "../../components/disable/disable";

const OfferPageContainer = () => {
  const router = useRouter();

  const offerId = router.query?.offerId;
  const chainId = router.query?.chainName;
  const userAddress = useAddress();
  const [refusedValidatedAdModal, setRefusedValidatedAdModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [offerData, setOfferData] = useState([]);
  const [royalties, setRoyalties] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [price, setPrice] = useState(null);
  const [imageModal, setImageModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const address = useAddress();
  const { contract: DsponsorAdminContract } = useContract(
    config[chainId]?.smartContracts?.DSPONSORADMIN?.address,
    config[chainId]?.smartContracts?.DSPONSORADMIN?.abi
  );
  const { mutateAsync } = useContractWrite(DsponsorAdminContract, "reviewAdProposals");
  const [urlFromChild, setUrlFromChild] = useState("");
  const [successFullRefuseModal, setSuccessFullRefuseModal] = useState(false);
  const [tokenData, setTokenData] = useState("");
  const [isWordAlreadyTaken, setIsWordAlreadyTaken] = useState(false);
  const { contract: tokenContract } = useContract(
    offerData?.nftContract?.prices[0]?.currency,
    "token"
  );
  const { data: symbolContract } = useContractRead(tokenContract, "symbol");
  const { data: decimalsContract } = useContractRead(tokenContract, "decimals");
  const NATIVECurrency = config[chainId]?.smartContracts?.NATIVE;
  const { setSelectedChain } = useSwitchChainContext();
  const [, setCanChangeMintPrice] = useState(false);
  const [offerManagementActiveTab, setOfferManagementActiveTab] = useState("integration");
  const [imageUrl, setImageUrl] = useState(null);
  const [accordionActiveTab, setAccordionActiveTab] = useState("details");

  const { data: bps } = useContractRead(DsponsorAdminContract, "feeBps");
  const maxBps = 10000;

  let tokenCurrencyAddress = offerData?.nftContract?.prices[0]?.currency;

  const {
    description = "description not found",
    id = "1",
    image = ["/images/gradient_creative.jpg"],
    name = "DefaultName"
  } = offerData?.metadata?.offer ? offerData.metadata.offer : {};

  const [itemProposals, setItemProposals] = useState(null);
  const [mediaShouldValidateAnAd, setMediaShouldValidateAnAd] = useState(false);
  const [
    sponsorHasAtLeastOneRejectedProposalAndNoPending,
    setSponsorHasAtLeastOneRejectedProposalAndNoPending
  ] = useState(false);
  const [offers, setOffers] = useState(null);
  const [isMedia, setIsMedia] = useState(false);

  const fetchAllOffersRef = React.useRef(false);

  useEffect(() => {
    const fetchOffers = async () => {
      if (fetchAllOffersRef.current) return;
      fetchAllOffersRef.current = true;

      try {
        const offers = await fetchAllOffers(chainId);
        setOffers(offers);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        fetchAllOffersRef.current = false;
      }
    };

    if (chainId) {
      fetchOffers();
    }
  }, [chainId]);

  const fetchOfferRef = React.useRef(false);

  useEffect(() => {
    const fetchingOffer = async () => {
      if (fetchOfferRef.current) return;
      fetchOfferRef.current = true;

      try {
        const offer = await fetchOffer(offerId, chainId);

        if (offer) {
          if (offer?.admins?.includes(address?.toLowerCase())) {
            setIsMedia(true);
          } else {
            setIsMedia(false);
          }
        }
      } catch (error) {
        console.error("Error fetching offer:", error);
      } finally {
        fetchOfferRef.current = false;
      }
    };

    if (offerId && chainId && address) {
      fetchingOffer();
    }
  }, [address, chainId, offerId]);

  useEffect(() => {
    if (offers) {
      // we want to get all the proposals for all the items from an offer (accept, reject, pending, all)
      // for that we filter the offers to associate the offer with the offerId
      const itemsOffers = offers?.filter((offer) => offer?.id === offerId);

      // we extract the only element from the array
      const tokenOffers = itemsOffers[0];

      // then we get the proposals for the offer but the offer contains multiple tokens in the nftContract key
      // we get the accepted, pending, rejected and all proposals
      // so we need get every proposals for every tokens in the nftContract key of tokenOffers
      // we filter the proposals to get the accepted, pending and rejected proposals
      // for that we can use the status key of the proposal "CURRENT_ACCEPTED", "CURRENT_PENDING", "CURRENT_REJECTED"
      const allProposals = tokenOffers?.nftContract?.tokens?.map((token) => {
        const acceptedProposals = token?.allProposals?.filter(
          (proposal) => proposal?.status === "CURRENT_ACCEPTED"
        );
        const pendingProposals = token?.allProposals?.filter(
          (proposal) => proposal?.status === "CURRENT_PENDING"
        );
        const rejectedProposals = token?.allProposals?.filter(
          (proposal) => proposal?.status === "CURRENT_REJECTED"
        );

        return {
          acceptedProposals,
          pendingProposals,
          rejectedProposals
        };
      });

      // we flatten the array of proposals
      const acceptedProposals = allProposals?.map((proposal) => proposal?.acceptedProposals).flat();
      const pendingProposals = allProposals?.map((proposal) => proposal?.pendingProposals).flat();
      const rejectedProposals = allProposals?.map((proposal) => proposal?.rejectedProposals).flat();

      const itemProposals = {
        name: name ?? "",
        pendingProposals,
        rejectedProposals,
        acceptedProposals,
        allProposals
      };

      setItemProposals(itemProposals);
    }
  }, [name, offers, offerId]);

  useEffect(() => {
    if (!itemProposals) return;
    // now we want to check one thing from the sponsor side and one thing from the media side
    // we want to check if the sponsor has at least one rejected proposal and no pending proposal
    // we want to check if the media should validate an ad or not (i.e. if the media has at least one pending proposal)

    // we check if the sponsor has only rejected proposals
    const sponsorHasAtLeastOneRejectedProposal = itemProposals?.rejectedProposals?.length > 0;
    const sponsorHasNoPendingProposal = itemProposals?.pendingProposals?.length === 0;
    const lastAcceptedProposalTimestamp =
      parseFloat(
        itemProposals?.acceptedProposals?.sort(
          (a, b) => b?.creationTimestamp - a?.creationTimestamp
        )[0]?.lastUpdateTimestamp
      ) * 1000;
    const lastRefusedProposalTimestamp =
      parseFloat(
        itemProposals?.rejectedProposals?.sort(
          (a, b) => b?.creationTimestamp - a?.creationTimestamp
        )[0]?.lastUpdateTimestamp
      ) * 1000;
    const sponsorHasNoMoreRecentValidatedProposal =
      new Date(lastAcceptedProposalTimestamp) <= new Date(lastRefusedProposalTimestamp);

    setSponsorHasAtLeastOneRejectedProposalAndNoPending(
      sponsorHasAtLeastOneRejectedProposal &&
        sponsorHasNoPendingProposal &&
        sponsorHasNoMoreRecentValidatedProposal
    );

    // now we check if the media should validate an ad
    const mediaShouldValidateAnAd = itemProposals?.pendingProposals?.length > 0;
    setMediaShouldValidateAnAd(mediaShouldValidateAnAd);
  }, [itemProposals]);

  const fetchImage = async (image) => {
    if (!image) {
      setImageUrl(null);
      return;
    }

    // get url image instead of ipfs:// starting url
    if (typeof image === "string" && image.startsWith("ipfs://")) {
      const storage = new ThirdwebStorage({ clientId: "6f375d41f2a33f1f08f6042a65d49ec9" });
      try {
        const ipfsUrl = await storage.resolveScheme(image);
        setImageUrl(ipfsUrl);
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    } else {
      setImageUrl(image);
    }
  };

  useEffect(() => {
    if (image) {
      fetchImage(image);
    } else {
      setImageUrl(null);
    }
  }, [image]);

  const fetchOfferSecondRef = React.useRef(false);

  useEffect(() => {
    if (offerId && chainId) {
      const fetchAdsOffers = async () => {
        if (fetchOfferSecondRef.current) return;
        fetchOfferSecondRef.current = true;

        try {
          const offer = await fetchOffer(offerId, chainId);

          setOfferData(offer);
          if (userAddress && offer?.admins?.includes(userAddress.toLowerCase())) {
            setIsOwner(true);
          }

          if (
            userAddress &&
            userAddress?.toLowerCase() === offer?.nftContract?.owner?.newOwner?.toLowerCase()
          ) {
            setCanChangeMintPrice(true);
          }
        } catch (error) {
          console.error("Error fetching offer:", error);
        } finally {
          fetchOfferSecondRef.current = false;
        }
      };
      setSelectedChain(config[chainId]?.network);

      if (chainId && offerId) {
        fetchAdsOffers();
      }
    }
  }, [offerId, successFullRefuseModal, userAddress, chainId, setSelectedChain]);

  useEffect(() => {
    if (!offerData) return;
    try {
      const currencyTokenObject = {};
      if (
        !decimalsContract &&
        !symbolContract &&
        tokenCurrencyAddress === "0x0000000000000000000000000000000000000000"
      ) {
        currencyTokenObject.symbol = NATIVECurrency.symbol;
        currencyTokenObject.decimals = NATIVECurrency.decimals;
      } else {
        currencyTokenObject.symbol = symbolContract;
        currencyTokenObject.decimals = decimalsContract;
      }

      const bigIntPrice =
        (BigInt(offerData?.nftContract?.prices[0]?.amount) * (BigInt(bps) + BigInt(maxBps))) /
        BigInt(maxBps);
      const formatPrice = ethers.utils.formatUnits(bigIntPrice, currencyTokenObject.decimals);

      setPrice(Number(Math.ceil(formatPrice * 1000) / 1000));
      setCurrency(currencyTokenObject);
    } catch (e) {
      console.error("Error: Currency not found for address", offerData?.nftContract?.prices[0], e);
    }
  }, [symbolContract, decimalsContract, offerData, bps, NATIVECurrency, tokenCurrencyAddress]);

  useEffect(() => {
    if (offerData?.nftContract?.royalty?.bps) {
      setRoyalties(offerData?.nftContract?.royalty?.bps / 100);
    } else {
      setRoyalties(0);
    }
  }, [offerData]);

  const handleSubmit = async (submissionArgs) => {
    try {
      await mutateAsync({
        args: [submissionArgs]
      });
      setRefusedValidatedAdModal(true);
      setSuccessFullRefuseModal(true);
    } catch (error) {
      console.error("Erreur de validation du token:", error);
      setSuccessFullRefuseModal(false);
      throw error;
    }
  };
  const handleUrlChange = (newUrl, tokenData) => {
    setIsWordAlreadyTaken(false);
    setUrlFromChild(newUrl);
    setTokenData(tokenData);
    for (const token of offerData.nftContract.tokens) {
      if (token.mint === null) return;
      if (tokenData?.toLowerCase() === token.mint.tokenData?.toLowerCase()) {
        setIsWordAlreadyTaken(true);
      }
    }
  };
  const metadata = {
    title: `Offer || SiBorg Ads - The Web3 Monetization Solution`,
    keyword:
      "audience engagement, web3, creator economic, NFT, creator monetization, creator economy, creator token, creator coin, creator tokenization, creator economy",

    desc: "Explore the future of media monetization. SiBorg Ads decentralized platform offers tokenized advertising spaces for dynamic and sustainable media funding."
  };
  if (!offerData || offerData.length === 0) {
    return (
      <div>
        <OfferSkeleton />
      </div>
    );
  }
  const modalHelper = {
    title: "Protocol Fees",
    body: (
      <div className="flex flex-col gap-8">
        <span className="text-jacarta-100 text-sm">
          The protocol fees (4%) are used to maintain the platform and the services provided. The
          fees are calculated based on the price of the ad space and are automatically deducted from
          the total amount paid by the buyer.
        </span>

        <div className="flex flex-col gap-2">
          <span className="text-white font-semibold">Initial Sale Scenario</span>
          <ul className="flex flex-col gap-2 list-disc text-sm" style={{ listStyleType: "disc" }}>
            <li>
              <span className="text-white">
                Amount sent to the creator: {formatAndRoundPrice(price)} {currency?.symbol}
              </span>
            </li>
            <li>
              <span className="text-white">
                Protocol fees: {formatAndRoundPrice(price * 0.04)} {currency?.symbol}
              </span>
            </li>
            <li>
              <span className="text-white">
                Total: {formatAndRoundPrice(price + price * 0.04)} {currency?.symbol}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-white font-semibold">Secondary Market Scenario</span>
          <ul className="flex flex-col gap-2 list-disc text-sm" style={{ listStyleType: "disc" }}>
            <li>
              <span className="text-white">
                Amount sent to the lister: {formatAndRoundPrice(price - price * 0.1 - price * 0.04)}{" "}
                {currency?.symbol}
              </span>
            </li>
            <li>
              <span className="text-white">
                Royalties sent to the creator: {formatAndRoundPrice(price * 0.1)} {currency?.symbol}
              </span>
            </li>
            <li>
              <span className="text-white">
                Protocol fees: {formatAndRoundPrice(price * 0.04)} {currency?.symbol}
              </span>
            </li>
            <li>
              <span className="text-white">
                Total: {formatAndRoundPrice(price)} {currency?.symbol}
              </span>
            </li>
          </ul>
        </div>
      </div>
    )
  };

  return (
    <Accordion.Root
      type="single"
      collapsible
      value={accordionActiveTab}
      onValueChange={setAccordionActiveTab}
    >
      <Meta {...metadata} />
      {/*  <!-- Item --> */}
      <section className="relative lg:mt-24 lg:pt-12  mt-24 pt-12 pb-8">
        <div className="container flex justify-center mb-6">
          <h1 className="text-jacarta-900 font-bold font-display mb-6 text-center text-5xl dark:text-white md:text-left lg:text-6xl xl:text-6xl">
            Offer{" "}
          </h1>
        </div>
        <picture className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
          <Image
            width={1519}
            height={773}
            priority
            src="/images/gradient_light.jpg"
            alt="gradient"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="container">
          {/* <!-- Item --> */}

          <div className="md:flex md:flex-wrap" key={id}>
            {/* <!-- Image --> */}
            <figure className="mb-8 md:w-2/5 md:flex-shrink-0 md:flex-grow-0 md:basis-auto lg:w-1/2 w-full flex justify-center">
              <button
                className="w-full"
                onClick={() => setImageModal(true)}
                style={{ height: "450px" }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl ?? ""}
                    alt="image"
                    className="rounded-2xl cursor-pointer h-full object-cover w-full"
                  />
                )}
              </button>

              {/* <!-- Modal Backdrop --> */}
              {imageModal && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setImageModal(false);
                    }
                  }}
                >
                  {/* <!-- Modal --> */}
                  <div className="modal-dialog !my-0 flex items-center justify-center">
                    <div className="modal fade show block">
                      <div className="modal-dialog !my-0 flex items-center justify-center">
                        <img
                          src={imageUrl ?? ""}
                          alt="image"
                          className="h-full object-cover w-full rounded-2xl"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-close absolute top-6 right-6"
                        onClick={() => setImageModal(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          className="h-6 w-6 fill-white"
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* <!-- end modal --> */}
                </div>
              )}
            </figure>

            {/* <!-- Details --> */}
            <div className="md:w-3/5 md:basis-auto md:pl-8 lg:w-1/2 lg:pl-[3.75rem]">
              {/* <!-- Collection / Likes / Actions --> */}
              <div className="mb-3 flex">
                {/* <!-- Collection --> */}
                <div className="flex items-center">
                  <Link
                    href={`/profile/${offerData?.initialCreator}`}
                    className="text-primaryPurple mr-2 text-sm font-bold"
                  >
                    {offerData?.initialCreator}
                  </Link>
                </div>
              </div>

              <h2 className="font-display text-jacarta-900 mb-4 text-3xl font-semibold dark:text-white">
                {name}
              </h2>

              <div className="mb-8 flex items-center flex-wrap gap-2 space-x-4 whitespace-nowrap">
                {activated_features.canSeeModalHelperOnOfferPage && (
                  <>
                    {currency?.symbol && (
                      <div className="flex items-center">
                        <span className="text-green text-sm font-medium tracking-tight mr-2">
                          {price} {currency?.symbol}
                        </span>
                        <ModalHelper {...modalHelper} size="small" />
                      </div>
                    )}
                  </>
                )}

                {offerData.nftContract.allowList && (
                  <span className="dark:text-jacarta-100 text-jacarta-100 text-sm">
                    {offerData.nftContract.maxSupply -
                      offerData.nftContract.tokens.filter((item) => item.mint != null).length}
                    /{offerData.nftContract.maxSupply} available
                  </span>
                )}
                <span className="text-jacarta-100 block text-sm dark:text-white">
                  Creator <strong>{royalties}% royalties</strong>
                </span>
              </div>

              <p className="dark:text-jacarta-100 mb-10">{description}</p>

              {(offerData?.disable ||
                new Date(offerData?.metadata?.offer?.valid_to) < new Date() ||
                !offerData?.nftContract?.prices[0]?.enabled) && <Disable isOffer={true} />}

              {isOwner && (
                <div className="dark:bg-secondaryBlack dark:border-jacarta-600 border-jacarta-100 rounded-2lg border bg-white p-8">
                  <div className=" sm:flex sm:flex-wrap">
                    <span className="dark:text-jacarta-100 text-jacarta-100 text-sm">
                      This page allows you to oversee submitted ads, offering tools to either
                      approve or reject them. Approve ads to make them live or reject those that
                      don&apos;t meet your standards, streamlining the content that reaches your
                      audience while maintaining quality control on your platform.{" "}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Accordion.Item value="details">
        <div className="container">
          <Accordion.Header className="w-full">
            <Accordion.Trigger
              className={`${accordionActiveTab === "details" && "bg-primaryPurple"} w-full flex items-center justify-center gap-4 mb-6 border border-primaryPurple hover:bg-primaryPurple cursor-pointer p-2 rounded-lg`}
            >
              <h2 className="text-jacarta-900 font-bold font-display text-center text-3xl dark:text-white ">
                Details
              </h2>
              <ChevronDownIcon
                className={`w-6 h-6 duration-300 ${accordionActiveTab === "details" && "transform rotate-180"}`}
              />
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="mb-8">
            <ItemsTabs
              contractAddress={offerData?.nftContract.id}
              offerId={offerId}
              initialCreator={offerData?.initialCreator}
              isToken={false}
              offerData={offerData}
              chainId={chainId}
            />
          </Accordion.Content>
        </div>
      </Accordion.Item>

      <Accordion.Item value="search">
        {!offerData.nftContract.allowList && (
          <div className="container flex flex-col justify-center mb-6">
            <Accordion.Header className="w-full">
              <Accordion.Trigger
                className={`${accordionActiveTab === "search" && "bg-primaryPurple"} w-full flex items-center justify-center gap-4 mb-6 border border-primaryPurple hover:bg-primaryPurple cursor-pointer p-2 rounded-lg`}
              >
                <h2 className="text-jacarta-900 font-bold font-display text-center text-3xl dark:text-white ">
                  Search
                </h2>
                <ChevronDownIcon
                  className={`w-6 h-6 duration-300 ${accordionActiveTab === "search" && "transform rotate-180"}`}
                />
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content>
              <div className="dark:bg-secondaryBlack dark:border-jacarta-600 border-jacarta-100 rounded-2lg border bg-white p-8">
                <div className=" sm:flex sm:flex-wrap">
                  <span className="dark:text-jacarta-100 text-jacarta-100 text-sm">
                    You can check if a word is available for purchase by using the search bar.
                    Simply type the word into the search bar and press enter to see if it is
                    available. This feature allows you to quickly find out if the word you are
                    interested in is free for acquisition.{" "}
                  </span>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Form offerId={offerId} onUrlChange={handleUrlChange} />
              </div>
              {urlFromChild && (
                <div className="grid grid-cols-1 gap-[1.875rem] md:grid-cols-2 lg:grid-cols-4">
                  <article className="relative">
                    <div className="dark:bg-secondaryBlack dark:border-jacarta-700 border-jacarta-100 rounded-2xl block border bg-white p-[1.1875rem] transition-shadow hover:shadow-lg text-jacarta-100">
                      {isWordAlreadyTaken ? (
                        <span className="text-red  ">This word is already taken ❌</span>
                      ) : (
                        <span className="text-green ">This word is available 🎉</span>
                      )}
                      <figure className="mt-2">
                        <Link href={urlFromChild ?? "#"}>
                          {imageUrl && (
                            <Image
                              src={imageUrl ?? ""}
                              alt="logo"
                              height={230}
                              width={230}
                              className="rounded-[0.625rem] w-full lg:h-[230px] object-contain"
                              loading="lazy"
                            />
                          )}
                        </Link>
                      </figure>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <Tippy content={<span className="p-2">{name}</span>}>
                          <Link
                            href={urlFromChild ?? "#"}
                            className="overflow-hidden text-ellipsis whitespace-nowrap min-w-[120px]"
                          >
                            <span className="font-display  text-jacarta-900 hover:text-primaryPurple text-base dark:text-white ">
                              {name}
                            </span>
                          </Link>
                        </Tippy>

                        <Tippy content={<span className="p-2">{tokenData}</span>}>
                          <div className="dark:border-jacarta-600 border-jacarta-100 max-w-[100px] overflow-hidden text-ellipsis flex items-center whitespace-nowrap rounded-md border py-1 px-2">
                            <span className="text-green text-sm font-medium tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                              {" "}
                              {tokenData}
                            </span>
                          </div>
                        </Tippy>
                      </div>
                    </div>
                  </article>
                </div>
              )}
            </Accordion.Content>
          </div>
        )}
      </Accordion.Item>

      <Accordion.Item value="validation">
        <div className="container">
          {activated_features.canSeeSubmittedAds && (
            <>
              <Accordion.Header className="w-full">
                <Accordion.Trigger
                  className={`${accordionActiveTab === "validation" && "bg-primaryPurple"} w-full flex items-center justify-center gap-4 mb-6 border border-primaryPurple hover:bg-primaryPurple cursor-pointer p-2 rounded-lg`}
                >
                  {isOwner && sponsorHasAtLeastOneRejectedProposalAndNoPending && (
                    <InfoIcon text="You have at least one rejected proposal and no pending proposal.">
                      <ExclamationCircleIcon className="w-6 h-6 text-red" />
                    </InfoIcon>
                  )}
                  {isMedia && mediaShouldValidateAnAd && (
                    <InfoIcon text="You have at least one ad to validate or to refuse.">
                      <ExclamationCircleIcon className="w-6 h-6 text-red" />
                    </InfoIcon>
                  )}
                  <h2 className="text-jacarta-900 font-bold font-display text-center text-3xl dark:text-white ">
                    Validation
                  </h2>
                  <ChevronDownIcon
                    className={`w-6 h-6 duration-300 ${accordionActiveTab === "validation" && "transform rotate-180"}`}
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Validation
                  chainId={chainId}
                  setSuccessFullRefuseModal={setSuccessFullRefuseModal}
                  setSelectedItems={setSelectedItems}
                  selectedItems={selectedItems}
                  offer={offerData}
                  offerId={offerId}
                  isOwner={isOwner}
                  handleSubmit={handleSubmit}
                  successFullRefuseModal={successFullRefuseModal}
                  setRefusedValidatedAdModal={setRefusedValidatedAdModal}
                  refusedValidatedAdModal={refusedValidatedAdModal}
                  sponsorHasAtLeastOneRejectedProposalAndNoPending={
                    sponsorHasAtLeastOneRejectedProposalAndNoPending
                  }
                  setSponsorHasAtLeastOneRejectedProposalAndNoPending={
                    setSponsorHasAtLeastOneRejectedProposalAndNoPending
                  }
                  mediaShouldValidateAnAd={mediaShouldValidateAnAd}
                  isMedia={isMedia}
                  isSponsor={isOwner}
                  itemTokenId={offerData?.nftContract?.id}
                />
              </Accordion.Content>
            </>
          )}
        </div>
      </Accordion.Item>

      <Accordion.Item value="offerManagement">
        {isOwner && (
          <div className="container">
            <Accordion.Header className="w-full">
              <Accordion.Trigger
                className={`${accordionActiveTab === "offerManagement" && "bg-primaryPurple"} w-full flex items-center justify-center gap-4 mb-6 border border-primaryPurple hover:bg-primaryPurple cursor-pointer p-2 rounded-lg`}
              >
                <h2 className="text-jacarta-900 font-bold font-display text-center text-3xl dark:text-white ">
                  Offer Management
                </h2>
                <ChevronDownIcon
                  className={`w-6 h-6 duration-300 ${accordionActiveTab === "offerManagement" && "transform rotate-180"}`}
                />
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content>
              <Tabs className="tabs">
                <TabList className="nav nav-tabs hide-scrollbar mb-12 flex items-center justify-start overflow-x-auto overflow-y-hidden border-b border-jacarta-100 pb-px dark:border-jacarta-600 md:justify-center">
                  <Tab
                    className="nav-item"
                    onClick={() => setOfferManagementActiveTab("integration")}
                  >
                    <button
                      className={
                        offerManagementActiveTab === "integration"
                          ? "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white active"
                          : "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white"
                      }
                    >
                      Integration
                    </button>
                  </Tab>
                  <Tab
                    className="nav-item"
                    key={id}
                    onClick={() => setOfferManagementActiveTab("updateOffer")}
                  >
                    <button
                      className={
                        offerManagementActiveTab === "updateOffer"
                          ? "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white active"
                          : "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white"
                      }
                    >
                      Update Offer
                    </button>
                  </Tab>
                  <Tab
                    className="nav-item"
                    onClick={() => setOfferManagementActiveTab("changeMintPrice")}
                  >
                    <button
                      className={
                        offerManagementActiveTab === "changeMintPrice"
                          ? "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white active"
                          : "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white"
                      }
                    >
                      Change Mint Price
                    </button>
                  </Tab>
                </TabList>

                <TabPanel>
                  <Integration
                    chainId={chainId}
                    offerId={offerId}
                    setCopied={setCopied}
                    copied={copied}
                    offerTokens={offerData?.nftContract?.tokens}
                  />
                </TabPanel>
                <TabPanel>
                  <UpdateOffer offer={offerData} />
                </TabPanel>
                <TabPanel>
                  <ChangeMintPrice offer={offerData} currency={currency} />
                </TabPanel>
              </Tabs>
            </Accordion.Content>
          </div>
        )}
      </Accordion.Item>
    </Accordion.Root>
  );
};

export default OfferPageContainer;
