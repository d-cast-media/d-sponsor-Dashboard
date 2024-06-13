import React, { useMemo, useState } from "react";
import ItemCardSkeleton from "../skeleton/ItemCardSkeleton";
import OfferItem from "../cards/offerItem";

const MainAuctions = ({ auctions, isAuctionsLoading }) => {
  const [mount, setMount] = useState(false);
  const [hotAuctions, setHotAuctions] = useState([]);

  const liveAuctions = useMemo(() => {
    return auctions?.filter(
      (auction) =>
        auction.status === "CREATED" &&
        auction?.listingType === "Auction" &&
        auction?.quantity > 0 &&
        new Date(auction?.startTime * 1000) < Date.now() &&
        new Date(auction?.endTime * 1000) > Date.now()
    );
  }, [auctions]);

  useMemo(() => {
    if (liveAuctions?.length === 0) return [];

    let tempAuctions = liveAuctions;

    if (!mount) {
      tempAuctions = liveAuctions.sort((a, b) => b.numberOfBids - a.numberOfBids).slice(0, 4);

      setHotAuctions(tempAuctions);
      setMount(true);
    }
  }, [liveAuctions, mount]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-xl font-semibold text-white">Hot Auctions 🔥</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {!isAuctionsLoading ? (
            <>
              {hotAuctions.map((auction, index) => (
                <OfferItem
                  key={index}
                  item={auction.item}
                  isToken={true}
                  listingType={auction?.listingType}
                  isListing={auction?.listingType}
                  isAuction={auction?.listingType === "Auction"}
                  url={
                    !auction?.tokenData
                      ? `/${auction?.chainId}/offer/${auction?.offerId}/${auction?.tokenId}`
                      : `/${auction?.chainId}/offer/${auction.item.nftContract?.adOffers[0]?.id}/${auction.tokenId}?tokenData=${auction.item.mint?.tokenData}`
                  }
                />
              ))}
            </>
          ) : (
            <>
              <ItemCardSkeleton />
              <ItemCardSkeleton />
              <ItemCardSkeleton />
              <ItemCardSkeleton />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MainAuctions;
