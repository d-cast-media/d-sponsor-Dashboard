import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import "tippy.js/dist/tippy.css"; // optional
import Meta from "../../components/Meta";
import ProfileOverview from "../../components/user/ProfileOverview";
import ProfileReferrals from "../../components/user/ProfileReferrals";
import UserTabs from "../../components/user/UserTabs";
import { useAddress } from "@thirdweb-dev/react";
import { fetchAllOffersByUserAddress } from "../../providers/methods/fetchAllOffersByUserAddress";
import { fetchAllTokenByOfferForAuser } from "../../providers/methods/fetchAllTokenByOfferForAuser";
import { useChainContext } from "../../contexts/hooks/useChainContext";
import config from "../../config/config";
import { getAddress } from "ethers/lib/utils";

const ManageSpaceContainer = () => {
  const router = useRouter();
  const address = useAddress();
  const [createdData, setCreatedData] = useState(null);
  const [mappedOwnedAdProposals, setMappedOwnedAdProposals] = useState(null);
  const [listedAuctionToken, setListedAuctionToken] = useState(null);
  const [tokenAuctionBids, setTokenAuctionBids] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { currentChainObject } = useChainContext();
  const [isPendingAdsOnOffer, setIsPendingAdsOnOffer] = useState(false);
  const [initialWallet, setInitialWallet] = useState(null);
  const [, setMount] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [createdOffers, setCreatedOffers] = useState(null);
  const [fetchedData, setFetchedData] = useState(false);

  const userAddress = router.query.manage;
  const chainId = currentChainObject?.chainId;
  const chainConfig = config[chainId];

  useEffect(() => {
    if (address && userAddress && getAddress(address) === getAddress(userAddress)) {
      setIsUserConnected(true);
    } else {
      setIsUserConnected(false);
    }
  }, [address, userAddress]);

  useEffect(() => {
    if (createdOffers) {
      // we need to check the number of pending offers on the user's offer
      // but if there is already an accepted offer, we don't count it
      const pendingOffers = createdOffers.filter(
        (offer) =>
          offer?.allProposals?.filter((proposal) => proposal?.status === "CURRENT_PENDING").length >
          0
      );

      if (pendingOffers.length > 0) {
        setIsPendingAdsOnOffer(true);
      } else {
        setIsPendingAdsOnOffer(false);
      }
    }
  }, [createdOffers]);

  const fetchDataRef = React.useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (fetchDataRef.current) {
        return;
      }
      fetchDataRef.current = true;

      try {
        const data = await fetch(
          `https://relayer.dsponsor.com/api/${chainId}/activity?userAddress=${userAddress}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
          .then((res) => res.json())
          .then((data) => {
            return data;
          })
          .catch((err) => console.error(err));

        setUserData(data);
        setMount(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        fetchDataRef.current = false;
      }
    };

    if (userAddress && chainId) {
      fetchData();
    }
  }, [userAddress, chainId]);

  useEffect(() => {
    if (address && !initialWallet) {
      setInitialWallet(address);
    }
  }, [address, initialWallet]);

  useEffect(() => {
    if (address && initialWallet && address !== initialWallet) {
      setInitialWallet(address);
      router.push(`/profile/${address}`);
    }
  }, [address, initialWallet, router]);

  const fetchCreatedDataRef = React.useRef(false);
  const fetchOwnedAdProposalsRef = React.useRef(false);
  const fetchAllDataRef = React.useRef(false);

  useEffect(() => {
    if (userAddress && chainId) {
      const fetchDataByUserAddress = async (fetchFunction) => {
        const dataArray = [];
        for (const [chainId] of Object.entries(config)) {
          const data = await fetchFunction(userAddress, chainId);
          dataArray?.push(...data);
        }
        return dataArray;
      };

      const fetchCreatedData = async () => {
        if (fetchCreatedDataRef.current) {
          return;
        }
        fetchCreatedDataRef.current = true;

        try {
          const offersByUserAddressArray = await fetchDataByUserAddress(
            fetchAllOffersByUserAddress
          );

          setCreatedOffers(offersByUserAddressArray);
          setCreatedData(offersByUserAddressArray);

          let allLatestListings;
          const userManagedOffers = offersByUserAddressArray?.filter((element) =>
            element?.admins?.includes(userAddress?.toLowerCase())
          );
          userManagedOffers?.forEach((element) => {
            element?.nftContract?.tokens?.forEach((token) => {
              const lastListing = token?.marketplaceListings?.sort(
                (a, b) => Number(b?.id) - Number(a?.id)
              )[0];

              const filterCondition =
                lastListing?.status === "CREATED" && lastListing?.quantity > 0;

              if (lastListing && filterCondition) {
                const listingWithChainConfig = {
                  ...lastListing,
                  chainConfig: element.chainConfig
                };

                allLatestListings = allLatestListings
                  ? [...allLatestListings, listingWithChainConfig]
                  : [listingWithChainConfig];
              }
            });
          });

          const mappedListedToken = allLatestListings
            ?.filter((element) => element?.listingType === "Auction")
            ?.map((element) => ({
              ...element,
              ...element?.token,
              marketplaceListings: [element],
              listingStatus: handleListingsStatusType(element?.status),
              chainConfig: element?.chainConfig,
              tokenData: element?.token.mint.tokenData,
              startTime: element?.startTime,
              endTime: element?.endTime,
              offerId: element?.token?.nftContract?.adOffers[0]?.id
            }));

          setListedAuctionToken(mappedListedToken);

          // get all tokens with a bid from the user
          let auctionBidsTokensArray;
          offersByUserAddressArray?.forEach((element) => {
            element?.nftContract?.tokens?.forEach((tokenElement) => {
              if (tokenElement?.marketplaceListings?.length > 0) {
                const listings = tokenElement?.marketplaceListings?.sort(
                  (a, b) => Number(b.id) - Number(a.id)
                );
                const lastLiveAuctionListing = listings?.find(
                  (listing) => listing?.status === "CREATED" && listing?.listingType === "Auction"
                );

                const isUserBidder = lastLiveAuctionListing?.bids?.some(
                  (bid) => bid?.bidder === userAddress?.toLowerCase()
                );

                if (isUserBidder) {
                  const token = {
                    ...element,
                    marketplaceListings: [tokenElement?.lastLiveAuction],
                    status: handleBidsStatusType(tokenElement?.status),
                    listingStatus: handleListingsStatusType(tokenElement?.lastLiveAuction?.status),
                    metadata: lastLiveAuctionListing?.token?.metadata,
                    tokenData: lastLiveAuctionListing?.token?.mint?.tokenData,
                    offerId: lastLiveAuctionListing?.token?.nftContract?.adOffers[0]?.id,
                    tokenId: lastLiveAuctionListing?.token?.tokenId,
                    endTime: lastLiveAuctionListing?.endTime
                  };

                  auctionBidsTokensArray = auctionBidsTokensArray
                    ? [...auctionBidsTokensArray, token]
                    : [token];
                }
              }
            });
          });

          setTokenAuctionBids(auctionBidsTokensArray);
        } catch (error) {
          console.error("Error fetching created data:", error);
        } finally {
          fetchCreatedDataRef.current = false;
        }
      };

      const fetchOwnedAdProposals = async () => {
        if (fetchOwnedAdProposalsRef.current) {
          return;
        }
        fetchOwnedAdProposalsRef.current = true;

        try {
          const ownedAdProposalsArray = await fetchDataByUserAddress(fetchAllTokenByOfferForAuser);

          const mappedOwnedAdProposals = ownedAdProposalsArray.flatMap((element) =>
            element.nftContract.tokens.map((token) => ({
              ...token,
              ...(token.mint.tokenData ? { tokenData: token.mint.tokenData } : {}),
              chainConfig: element.chainConfig,
              adParameters: element.adParameters,
              id: `${element.id}-${token.tokenId}`,
              offerId: element.id,
              disable: element.disable,
              endTime:
                token?.marketplaceListings?.length > 0 && token?.marketplaceListings[0]?.endTime
            }))
          );

          setMappedOwnedAdProposals(mappedOwnedAdProposals);
        } catch (error) {
          console.error("Error fetching owned ad proposals:", error);
        } finally {
          fetchOwnedAdProposalsRef.current = false;
        }
      };

      const fetchAllManageData = async () => {
        if (fetchAllDataRef.current) {
          return;
        }
        fetchAllDataRef.current = true;

        if (chainId && userAddress) {
          try {
            await fetchCreatedData();
            await fetchOwnedAdProposals();

            setFetchedData(true);
          } catch (error) {
            console.error("Error fetching manage data:", error);
          } finally {
            fetchAllDataRef.current = false;
          }
        }
      };

      if (address && userAddress && getAddress(address) === getAddress(userAddress))
        setIsOwner(true);

      if (!fetchedData) {
        fetchAllManageData();
      }
    }
  }, [userAddress, address, chainId, chainConfig, fetchedData]);

  const handleListingsStatusType = (status) => {
    switch (status) {
      case "CREATED":
        return "Active";
      case "COMPLETED":
        return "Finished";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Active";
    }
  };
  const handleBidsStatusType = (status) => {
    switch (status) {
      case "CREATED":
        return "HIGHEST BIDDER";
      case "CONFIRMED":
        return "AUCTION WON";
      case "CANCELLED":
        return "OUTBID";
      default:
        return "HIGHEST BIDDER";
    }
  };
  useEffect(() => {
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [copied]);
  const metadata = {
    title: "Profile || SiBorg Ads - The Web3 Monetization Solution",
    keyword:
      "audience engagement, web3, creator economic, NFT, creator monetization, creator economy, creator token, creator coin, creator tokenization, creator economy",
    desc: "Profile your ad spaces on SiBorg Ads."
  };
  return (
    <>
      <Meta {...metadata} />
      {/* <!-- Profile --> */}

      <div className=" " key="5">
        {/* <!-- Banner --> */}
        <div className="relative " style={{ height: "8rem" }}>
          <Image
            width={1519}
            height={150}
            src="/images/gradient_creative.jpg"
            alt="banner"
            className="w-full h-full object-cover"
          />
        </div>
        {/* <!-- end banner --> */}

        <div className="max-w-5xl mx-auto mt-12">
          <div className="flex flex-col gap-16 mx-4">
            <ProfileOverview userData={userData} ownedTokens={mappedOwnedAdProposals} />

            {isUserConnected && (
              <ProfileReferrals
                userData={userData}
                userAddr={address}
                manageAddress={userAddress}
              />
            )}

            <UserTabs
              mappedownedAdProposals={mappedOwnedAdProposals}
              createdData={createdData}
              listedAuctionToken={listedAuctionToken}
              tokenAuctionBids={tokenAuctionBids}
              isPendingAdsOnOffer={isPendingAdsOnOffer}
              isOwner={isOwner}
              manageAddress={userAddress}
              offers={createdOffers}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageSpaceContainer;
