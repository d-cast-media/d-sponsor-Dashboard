import React, { useState, useEffect, useMemo } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { activated_features } from "../../data/activated_features";
import Transactions from "./Transactions";
import OwnedOffersCategoriesItems from "../categories/ownedOffers_categories_items";
import OwnedAdProposalsCategoriesItems from "../categories/ownedAdProposals_categories_item";
import AuctionsCategories from "../categories/Auctions_categories";
import TokenAuctionBids from "../categories/tokenAuctionBids";
import Bids from "./bidsActivity";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import InfoIcon from "../informations/infoIcon";
import Link from "next/link";
import {
  ActivityIcon,
  CoinsIcon,
  GavelIcon,
  LoaderIcon,
  MegaphoneIcon,
  TrophyIcon
} from "lucide-react";
import { useSearchParams } from "next/navigation";

const UserTabs = ({
  mappedownedAdProposals,
  isOwner,
  createdData,
  listedAuctionToken,
  tokenAuctionBids,
  isPendingAdsOnOffer,
  manageAddress,
  offers,
  lastActivities,
  isLoadingTransactions,
  isLoadingBids,
  marketplaceBids,
  isLoading
}) => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState(tab);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const tabItem = useMemo(
    () => [
      { id: 1, text: "Activity", section: "activity", icon: <ActivityIcon className="h-4 w-4" /> },
      { id: 2, text: "Bids", section: "bids", icon: <GavelIcon className="h-4 w-4" /> },
      { id: 3, text: "Owned tokens", section: "owned", icon: <CoinsIcon className="h-4 w-4" /> },
      {
        id: 4,
        text: "Auction listed tokens",
        section: "auction",
        icon: <TrophyIcon className="h-4 w-4" />
      },
      {
        id: 5,
        text: "Token Auction Bids",
        section: "tokenAuctionBids",
        icon: <LoaderIcon className="h-4 w-4" />
      },
      ...(activated_features.canCreateOffer
        ? [
            {
              id: 6,
              text: "Created Offers",
              section: "createdOffers",
              icon: <MegaphoneIcon className="h-4 w-4" />
            }
          ]
        : [])
    ],
    []
  );

  useEffect(() => {
    if (tab) {
      setSelectedTab(tab);
    } else {
      setSelectedTab("activity");
    }
  }, [tab]);

  return (
    <Tabs
      className="tabs"
      selectedIndex={tabItem.findIndex((item) => item.section === selectedTab)}
      onSelect={(index) => setSelectedTab(tabItem[index].section)}
    >
      <TabList className="nav nav-tabs hide-scrollbar mb-12 flex items-center justify-start overflow-x-auto overflow-y-hidden border-b border-jacarta-100 pb-px dark:border-jacarta-800 md:justify-center">
        {tabItem.map(({ id, text, icon, section }) => (
          <Tab className="nav-item" key={id}>
            <Link href={`/profile/${manageAddress}?tab=${section}`} scroll={false}>
              <button
                className={
                  selectedTab === section
                    ? "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white active"
                    : "nav-link hover:text-jacarta-900 text-jacarta-100 relative flex items-center whitespace-nowrap py-3 px-4 dark:hover:text-white"
                }
              >
                {isPendingAdsOnOffer && isOwner && text === "Created Offers" && (
                  <InfoIcon text="You have 1 or more ads proposals to check on your offer">
                    <ExclamationCircleIcon className="h-5 w-5 text-red mr-2" />
                  </InfoIcon>
                )}
                {icon}
                <span className="font-display text-base font-medium ml-2">{text}</span>
              </button>
            </Link>
          </Tab>
        ))}
      </TabList>
      <TabPanel>
        <Transactions
          manageAddress={manageAddress}
          isLoading={isLoadingTransactions}
          lastActivities={lastActivities}
        />
      </TabPanel>
      <TabPanel>
        <Bids marketplaceBids={marketplaceBids} isLoading={isLoadingBids} />
      </TabPanel>
      <TabPanel>
        <OwnedAdProposalsCategoriesItems
          data={mappedownedAdProposals}
          isOwner={isOwner}
          isLoading={isLoading}
        />
      </TabPanel>
      <TabPanel>
        <AuctionsCategories data={listedAuctionToken} isOwner={isOwner} isLoading={isLoading} />
      </TabPanel>
      <TabPanel>
        <TokenAuctionBids data={tokenAuctionBids} isOwner={isOwner} isLoading={isLoading} />
      </TabPanel>
      <TabPanel>
        <OwnedOffersCategoriesItems
          data={createdData}
          isPendingAdsOnOffer={isPendingAdsOnOffer}
          isOwner={isOwner}
          offers={offers}
          isLoading={isLoading}
        />
      </TabPanel>
    </Tabs>
  );
};

export default UserTabs;
