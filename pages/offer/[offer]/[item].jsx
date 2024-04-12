import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import "tippy.js/dist/tippy.css";
import styles from "../../../styles/createPage/style.module.scss";
import Meta from "../../../components/Meta";
import Image from "next/image";
import { useAddress, darkTheme, useBalance, Web3Button, useTokenBalance, useContract, useContractRead, useContractWrite, useStorageUpload, useTokenDecimals, CheckoutWithCard, CheckoutWithEth } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import SliderForm from "../../../components/sliderForm/sliderForm.jsx";
import Step_1_Mint from "../../../components/sliderForm/PageMint/Step_1_Mint";
import Step_2_Mint from "../../../components/sliderForm/PageMint/Step_2_Mint";
import Step_3_Mint from "../../../components/sliderForm/PageMint/Step_3_Mint";
import PreviewModal from "../../../components/modal/previewModal";
import { FileUploader } from "react-drag-drop-files";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { ItemsTabs } from "../../../components/component";
import { useDispatch } from "react-redux";
import { ConnectWallet } from "@thirdweb-dev/react";
import { DSponsorAdmin } from "@dsponsor/sdk";
import { fetchDataFromIPFS } from "../../../data/services/ipfsService";
import { bufferAdParams } from "../../../utils/formatedData";
import  BuyModal  from "../../../components/modal/buyModal";

const Item = () => {
  const router = useRouter();

  const offerId = router.query.offer;
  const tokenId = router.query?.item;

  const [tokenIdString, setTokenIdString] = useState(null);

  const [data, setData] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const address = useAddress();
  const [isOwner, setIsOwner] = useState(false);
  const [file, setFile] = useState(null);
  const [imageModal, setImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [link, setLink] = useState("https://");
  const [amountToApprove, setAmountToApprove] = useState(null);
  const [royalties, setRoyalties] = useState(null);
  const [errors, setErrors] = useState({});
  const [finalPrice, setFinalPrice] = useState(null);
  const [successFullUpload, setSuccessFullUpload] = useState(false);
  const { contract: DsponsorAdminContract } = useContract("0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09");
  const { contract: DsponsorNFTContract } = useContract(offerData[0]?.nftContract);
  const { mutateAsync: uploadToIPFS, isLoading: isUploading } = useStorageUpload();
  const { mutateAsync: mintAndSubmit } = useContractWrite(DsponsorAdminContract, "mintAndSubmit");
  const { mutateAsync: submitAd } = useContractWrite(DsponsorAdminContract, "submitAdProposals");
  const { contract: tokenContract } = useContract(offerData[0]?.currencies[0], "token");
  const { data: tokenBalance, isLoading, error } = useBalance(offerData[0]?.currencies[0]);
  const { mutateAsync: approve, isLoading: isLoadingApprove } = useContractWrite(tokenContract, "approve");
  const { data: bps } = useContractRead(DsponsorAdminContract, "feeBps");
  const { data: isAllowedToMint } = useContractRead(DsponsorNFTContract, "tokenIdIsAllowedToMint", tokenIdString);
  const { data: royaltiesInfo } = useContractRead(DsponsorNFTContract, "royaltyInfo", [tokenIdString, 100]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validate, setValidate] = useState(false);
  const [currency, setCurrency] = useState(null);
  const [adStatut, setAdStatut] = useState(null);
  const [offerNotFormated, setOfferNotFormated] = useState(false);
  const [price, setPrice] = useState(null);
  const [buyModal, setBuyModal] = useState(false);
  const [buyMethod, setBuyMethod] = useState(false);
  const stepsRef = useRef([]);
  const numSteps = 3;
  
  useEffect(() => {
    if (offerId) {
      const fetchAdsOffers = async () => {
        const admin = new DSponsorAdmin({ chain: { alchemyAPIKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY, chainName: "ethereum-sepolia" } });
        const offer = await admin.getOffer({ offerId: offerId });
        const params = await admin.getAdParameters({ offerId: offerId });

        const normalizedParams = bufferAdParams(params);

      
        try{
          
          const currencyToken = admin.chain.getCurrencyByAddress(offer.currencies[0]);
          const formatPrice = offer.prices[0] / 10 ** currencyToken.decimals;
          setPrice(formatPrice);
          setCurrency(currencyToken);
        }catch(e){
          console.error("Error: Currency not found for address", offer.currencies[0]);
          setOfferNotFormated(true);
        }

        if (address) {
          const mintedToken = await admin.getOwnedOfferTokens({ address: address });
          console.log(mintedToken, "mintedToken");
          console.log(offer, "offer");
          for (const element of mintedToken) {
            if (element.tokenId === tokenId && element.nftContractAddress.toLowerCase() == offer.nftContract) {
              
              setIsOwner(true);
            }
          }
        }
        const destructuredIPFSResult = await fetchDataFromIPFS(offer.offerMetadata);
        const combinedData = {
          ...offer,
          ...destructuredIPFSResult,
          normalizedParams,
        };
       
        console.log(combinedData, "combinedData");
        setOfferData([combinedData]);
      };

      fetchAdsOffers();
    }

    setTokenIdString(tokenId?.toString());
  }, [offerId, router, address, tokenId]);

  useEffect(() => {
    const admin = new DSponsorAdmin();
    const fetchAdsOffers = async () => {
      if (!offerId) return;
      const checkAds = async (fetchFunction) => {
        const ads = await fetchFunction;
        console.log(ads, "ads");
        return ads.some((ad) => ad.tokenId === tokenId);
      };

      if (await checkAds(admin.getRejectedAds({ offerId: offerId }))) {
        setAdStatut(0);
        return;
      }

      if (await checkAds(admin.getValidatedAds({ offerId: offerId }))) {
        setAdStatut(1);
        return;
      }

      if (await checkAds(admin.getPendingAds({ offerId: offerId }))) {
        setAdStatut(2);
      }
      else {
        setAdStatut(3);
      }
    };

    fetchAdsOffers();
  }, [offerId, tokenId]);
 

  useEffect(() => {
    if (royaltiesInfo) setRoyalties(ethers.BigNumber.from(royaltiesInfo[1]?._hex).toNumber());
  }, [royaltiesInfo]);

  const validateInputs = () => {
    let isValid = true;
    let newErrors = {};

    if (!file) {
      newErrors.imageError = "Image is missing.";
      isValid = false;
    }

    if (!link || !isValidURL(link)) {
      newErrors.linkError = "The link is missing or invalid.";
      isValid = false;
    }
    setValidate(isValid);
    setErrors(newErrors);
    return isValid;
  };

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleLogoUpload = (file) => {
    if (file) {
      setFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (price && bps) {
      const bpsValueHex = bps._hex;
      const bpsValueDecimal = ethers.BigNumber.from(bpsValueHex).toNumber();
      const bpsValuePercentage = bpsValueDecimal / 10000;

      const priceAsNumber = price * bpsValuePercentage + price;

      const priceAsNumberString = priceAsNumber.toString();

      setFinalPrice(priceAsNumberString);
      const amountToApprove = ethers.utils.parseUnits(priceAsNumberString, currency.decimals);

      setAmountToApprove(amountToApprove);
    }
  }, [data, bps, offerData, currency, price]);

  const handleApprove = async () => {
    try {
      const allowance = await tokenContract.call("allowance", [address, "0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09"]);

      if (allowance > amountToApprove) return;
      await approve({ args: ["0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09", amountToApprove] });
      console.log("Approvation réussie");
    } catch (error) {
      console.error("Erreur d'approbation:", error);
    }
  };

  const handleSubmit = async () => {
    if(!buyMethod){

      if (!validateInputs()) {
        return;
      }
    }
    // IPFS upload

    let userBalance = checkUserBalance(tokenBalance, price);
    if (userBalance) {
      try {
        if (offerData[0]?.currencies[0] !== "0x0000000000000000000000000000000000000000") {
          await handleApprove();
        }
      } catch (error) {
        console.error("Erreur d'approbation des tokens:", error);
      }
      try {
         const uploadUrl = await uploadToIPFS({
           data: [file],
           options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true },
         });
        

        const argsMintAndSubmit = {
          tokenId: tokenIdString,
          to: address,
          currency: offerData[0]?.currencies[0],
          tokenData: "null",
          offerId: offerId,
          adParameters:[] ,
          adDatas: [],
          referralAdditionalInformation: "",
        };
        const argsAdSubmited = {
          offerId: [offerId, offerId],
          tokenId: [tokenIdString, tokenIdString],
          adParameters: offerData[0]?.normalizedParams,
          data: [uploadUrl[0], link],
        };
        const isEthCurrency = offerData[0]?.currencies[0] === "0x0000000000000000000000000000000000000000";
        const functionWithPossibleArgs = (adStatut === 0 || adStatut === 3  ) && !isAllowedToMint  ? Object.values(argsAdSubmited) : argsMintAndSubmit;
        const argsWithPossibleOverrides = isEthCurrency ? { args: [functionWithPossibleArgs], overrides: { value: amountToApprove } } : { args: [functionWithPossibleArgs] };
        // console.log(adStatut, "adStatut")
        // console.log(isAllowedToMint, "isAllowedToMint")
        if ((adStatut === 0 || adStatut === 3) && (!isAllowedToMint)) {
          // console.log("submitAd");
          await submitAd({ args: functionWithPossibleArgs });
        } else {
          console.log(argsWithPossibleOverrides);
          await mintAndSubmit(argsWithPossibleOverrides);
        }

        setSuccessFullUpload(true);
      } catch (error) {
        console.error("Erreur de soumission du token:", error);
        setSuccessFullUpload(false);
      }
    }
  };

  const checkUserBalance = (tokenAddressBalance, priceToken) => {
    try {
      const parsedTokenBalance = parseFloat(tokenAddressBalance.displayValue);
      const parsedPriceToken = parseFloat(priceToken);

      if (parsedTokenBalance >= parsedPriceToken) {
        console.log("user has enough balance");
        return true;
      } else {
        console.log("user has not enough balance");
        return false;
      }
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      return null;
    }
  };
  const handleBuyModal = () => {
    setBuyModal(!buyModal);
    setBuyMethod(true);
  
  };
  const handlePreviewModal = () => {
    
    setShowPreviewModal(!showPreviewModal);
    validateInputs();
  };
  const successFullUploadModal = {
    title: "Ad Space",
    body: "Congratulations, you proposed an ad space.",
    subBody: "The media still has the power to validate or reject ad assets.",
    buttonTitle: "Manage Spaces",
    hrefButton: `/manageSpaces/${address}`,
  };
  const statutAds = {
    pending: "🔍 Your ad is pending, wait the validation of the creator",
    rejected: "❌ Your ad has been rejected, you can submit an other ads below",
    accepted: "🎉 Congratulations ! Your ad has been accepted by the creator ! ",
  };

  if (!offerData || offerData.length === 0) {
    return <div>Chargement...</div>;
  }

  const { description = "description not found", id="1", image =["/images/gradient_creative.jpg"], name ="DefaultName"} = offerData[0].offer ? offerData[0].offer : {};

  return (
    <>
      <Meta title={` || d>sponsor | Media sponsor Marketplace `} />
      {/*  <!-- Item --> */}
      <section className="relative lg:mt-24 lg:pt-12  mt-24 pt-12 pb-8">
        <div className="mb-8 container flex justify-center flex-col items-center ">
          <div className=" flex justify-center ">
            <h1 className="text-jacarta-700 font-bold font-display mb-6 text-center text-5xl dark:text-white md:text-left lg:text-6xl xl:text-6xl">{isOwner ? "Your Ad Space" : "Buy Ad Space"} </h1>
            <span className={`ml-2 text-sm font-bold ${isOwner ? (adStatut === 0 ? "text-red" : adStatut === 1 ? "text-green" : adStatut === 2 ? "text-accent" : "hidden") : "hidden"}`}>
              {adStatut === 0 ? "Rejected" : adStatut === 1 ? "Accepted" : adStatut === 2 ? "Pending" : ""}
            </span>
          </div>
          <p className={`${isOwner ? (adStatut === 0 ? "text-red" : adStatut === 1 ? "text-green" : adStatut === 2 ? "text-accent" : "hidden") : "hidden"} text-sm font-bold`}>
            {adStatut === 0 ? statutAds.rejected : adStatut === 1 ? statutAds.accepted : statutAds.pending}
          </p>
        </div>

        <div className="container">
          {/* <!-- Item --> */}

          <div className="md:flex md:flex-wrap" key={id}>
            {/* <!-- Image --> */}
            <figure className="mb-8 md:w-2/5 md:flex-shrink-0 md:flex-grow-0 md:basis-auto lg:w-1/2 w-full flex justify-center">
              <button className=" w-full" onClick={() => setImageModal(true)} style={{ height: "450px" }}>
                <Image width={585} height={726} src={image[0]} alt="image" className="rounded-2xl cursor-pointer h-full object-contain w-full" />
              </button>

              {/* <!-- Modal --> */}
              <div className={imageModal ? "modal fade show block" : "modal fade"}>
                <div className="modal-dialog !my-0 flex h-full max-w-4xl items-center justify-center">
                  <Image width={582} height={722} src={image[0]} alt="image" className="h-full object-cover w-full rounded-2xl" />
                </div>

                <button type="button" className="btn-close absolute top-6 right-6" onClick={() => setImageModal(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="h-6 w-6 fill-white">
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
                  </svg>
                </button>
              </div>
              {/* <!-- end modal --> */}
            </figure>

            {/* <!-- Details --> */}
            <div className="md:w-3/5 md:basis-auto md:pl-8 lg:w-1/2 lg:pl-[3.75rem]">
              {/* <!-- Collection / Likes / Actions --> */}
              <div className="mb-3 flex">
                {/* <!-- Collection --> */}
                <div className="flex items-center">
                  <Link href="#" className="text-accent mr-2 text-sm font-bold">
                    0x00000000000000000000000000000022
                  </Link>
                  <span className="dark:border-jacarta-600 bg-green inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white" data-tippy-content="Verified Collection">
                    <Tippy content={<span>Verified Collection</span>}>
                      <svg className="icon h-[.875rem] w-[.875rem] fill-white">
                        <use xlinkHref="/icons.svg#icon-right-sign"></use>
                      </svg>
                    </Tippy>
                  </span>
                </div>
              </div>

              <h1 className="font-display text-jacarta-700 mb-4 text-4xl font-semibold dark:text-white">{name}</h1>

              <div className="mb-8 flex items-center space-x-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Tippy content={<span>{currency?.symbol ? currency?.symbol : "N/A"}</span>}>
                    <span className="-ml-1">
                      <svg className="icon mr-1 h-4 w-4">
                        <use xlinkHref="/icons.svg#icon-ETH"></use>
                      </svg>
                    </span>
                  </Tippy>
                  <span className="text-green text-sm font-medium tracking-tight">
                    {price} {currency?.symbol ? currency?.symbol : "N/A"}
                  </span>
                </div>

                <span className="dark:text-jacarta-300 text-jacarta-400 text-sm">N° {tokenId}</span>
                <span className="text-jacarta-400 block text-sm dark:text-white">
                  Creator <strong>{royalties}% royalties</strong>
                </span>
              </div>

              <p className="dark:text-jacarta-300 mb-10">{description}</p>

              <div className="dark:bg-jacarta-700 dark:border-jacarta-600 border-jacarta-100 rounded-2lg border flex flex-col gap-4 bg-white p-8">
                <div className=" sm:flex sm:flex-wrap">
                  <span className="dark:text-jacarta-300 text-jacarta-400 text-sm">
                    Buying the ad space give you the exclusive right to submit an ad. The media still has the power to validate or reject ad assets. You re free to change the ad at anytime. And free to resell on the open
                    market your ad space.{" "}
                  </span>
                </div>
                <div className="w-full flex justify-center">
                  {!isOwner && isAllowedToMint && (
                    <button type="button" className="bg-accent shadow-accent-volume hover:bg-accent-dark w-36 rounded-full py-3 px-8 text-center font-semibold text-white transition-all" onClick={handleBuyModal}>
                      Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- end item --> */}

      <div>
        {!offerNotFormated && isOwner ? (
          <div>
            <SliderForm styles={styles} handlePreviewModal={handlePreviewModal} stepsRef={stepsRef} numSteps={numSteps}>
              <Step_1_Mint stepsRef={stepsRef} styles={styles} adParamaters={["Grid Logo & Link"]} />
              <Step_2_Mint stepsRef={stepsRef} styles={styles} file={file} handleLogoUpload={handleLogoUpload} />
              <Step_3_Mint stepsRef={stepsRef} styles={styles} setLink={setLink} link={link} />
            </SliderForm>
          </div>
        ) : //Message to say that the NFT is not allowed to mint
        (isOwner && adStatut === 3) || adStatut === 0 ? (
          <div>
            <SliderForm styles={styles} handlePreviewModal={handlePreviewModal} stepsRef={stepsRef} numSteps={numSteps}>
              <Step_1_Mint stepsRef={stepsRef} styles={styles} adParamaters={["Grid Logo & Link"]} />
              <Step_2_Mint stepsRef={stepsRef} styles={styles} file={file} handleLogoUpload={handleLogoUpload} />
              <Step_3_Mint stepsRef={stepsRef} styles={styles} setLink={setLink} link={link} />
            </SliderForm>
          </div>
        ) : adStatut === 2 ? (
          <div className="flex justify-center">
            <p>Your ad proposal is currently being reviewed by the creator.</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <p>{isAllowedToMint ? "" : !offerNotFormated ? "Sorry, someone already own this NFT " : "Offer isn't well formated to buy"}</p>
          </div>
        )}
      </div>

      {/* <ItemsTabs /> */}
      <div className="container mb-12">
        <ItemsTabs contractAddress={offerData[0]?.nftContract} offerId={offerId} />
      </div>
      {showPreviewModal && (
        <div className="modal fade show bloc">
          <PreviewModal
            handlePreviewModal={handlePreviewModal}
            handleSubmit={handleSubmit}
            link={link}
            name={true}
           
            
            description={true}
            
            previewImage={previewImage}
            errors={errors}
            successFullUpload={successFullUpload}
            validate={validate}
            buttonTitle="Ad proposal"
            modalTitle="Ad Space Preview"
            successFullUploadModal={successFullUploadModal}
          />
        </div>
      )}
      {buyModal && (
        <div className="modal fade show block">
          <BuyModal finalPrice={finalPrice} price={price} handleSubmit={handleSubmit} handleBuyModal={handleBuyModal} name={name} image={image} selectedCurrency={currency.symbol} selectedRoyalties={royalties} />
        </div>
      )}
    </>
  );
};

export default Item;
