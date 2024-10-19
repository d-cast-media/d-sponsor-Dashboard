import { DSPONSOR_ADMIN_ABI } from "@/abi/dsponsorAdmin";
import StyledWeb3Button from "@/components/ui/buttons/StyledWeb3Button";
import Input from "@/components/ui/Input";
import config from "@/config/config";
import { client } from "@/data/services/client";
import { Divider, Switch } from "@nextui-org/react";
import Link from "next/link";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { resolveScheme, download, upload } from "thirdweb/storage";

const Telegram = ({
  chainId,
  offerData,
  offerId
}: {
  chainId: number;
  offerData: any;
  offerId: number;
}) => {
  const [telegramChannels, setTelegramChannels] = React.useState<number[] | undefined>(undefined);
  const [valueTelegramChannels, setValueTelegramChannels] = React.useState<string | undefined>(
    undefined
  );
  const [isTelegramEnabled, setIsTelegramEnabled] = React.useState<boolean>(true);
  const [metadatas, setMetadatas] = React.useState<any | null>(null);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);

  //   const { contract } = useContract(
  // config[chainId]?.smartContracts?.DSPONSORADMIN?.address as Address
  //   );

  const contract = getContract({
    client: client,
    chain: config[chainId].chainObject,
    address: config[chainId].smartContracts.DSPONSORADMIN.address,
    abi: DSPONSOR_ADMIN_ABI
  });

  //   const { mutateAsync } = useContractWrite(contract, "updateOffer");
  const { mutateAsync } = useSendTransaction();

  useEffect(() => {
    const fetchMetadatas = async (metadataURL) => {
      if (metadataURL) {
        try {
          //   const initialMetadatas = await storage.downloadJSON(metadataURL);
          const response = await download({
            uri: metadataURL,
            client: client
          });
          const initialMetadatas = await response.json();

          setMetadatas(initialMetadatas);
          setTelegramChannels(initialMetadatas?.offer?.telegramIntegration?.telegramChannels);
          setValueTelegramChannels(
            initialMetadatas?.offer?.telegramIntegration?.telegramChannels?.join(", ")
          );
          setIsTelegramEnabled(initialMetadatas?.offer?.telegramIntegration?.enabled);
        } catch (error) {
          console.error(error);
        }

        setIsMounted(true);
      }
    };

    if (offerData && !isMounted) {
      fetchMetadatas(offerData?.metadataURL);
    }
  }, [isMounted, offerData]);

  const handleTelegramChannelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const channels = e.target.value?.split(/[\s,]+/).map((channel) => channel.trim());
    const filteredChannels = channels.filter((channel) => channel !== "");
    const uniqueChannels = [...new Set(filteredChannels)];
    const almostFinalChannels: (number | null)[] =
      uniqueChannels?.map((channel) => {
        const parsedChannel = parseInt(channel);
        return isNaN(parsedChannel) ? null : parsedChannel;
      }) ?? [];

    const finalChannels = almostFinalChannels?.filter((channel) => channel !== null) as number[];

    setTelegramChannels(finalChannels);
    setValueTelegramChannels(e.target.value);
  };

  const uploadNewMetadatas = async (originalMetadatas) => {
    let finalMetadatas = { ...originalMetadatas };

    // make sure metadatas is a valid JSON object
    if (typeof finalMetadatas !== "object") {
      throw new Error("Metadatas are not correct");
    }

    // check if the metadatas object has the required fields
    if (!finalMetadatas?.offer?.name) {
      throw new Error("Metadatas must have a name field");
    } else if (!finalMetadatas?.offer?.description) {
      throw new Error("Metadatas must have a description field");
    } else if (!finalMetadatas?.offer?.external_link) {
      throw new Error("Metadatas must have an external_link field");
    } else if (!finalMetadatas?.offer?.image) {
      throw new Error("Metadatas must have an image field");
    } else if (!finalMetadatas?.offer?.valid_from) {
      throw new Error("Metadatas must have a valid_from field");
    } else if (!finalMetadatas?.offer?.valid_to) {
      throw new Error("Metadatas must have a valid_to field");
    }

    try {
      const jsonUri = await upload({
        client: client,
        files: [finalMetadatas]
      });
      const jsonUrl = resolveScheme({
        uri: jsonUri,
        client: client
      });
      return jsonUrl;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  };

  const handleUpdateOffer = async (metadatas: any) => {
    if (!metadatas) return;

    const updatedMetadatas = {
      ...metadatas,
      offer: {
        ...metadatas.offer,
        telegramIntegration: {
          enabled: isTelegramEnabled,
          telegramChannels: telegramChannels
        }
      }
    };

    let newMetadataUrl: string = "";
    try {
      newMetadataUrl = (await uploadNewMetadatas(updatedMetadatas)) as string;
    } catch (error) {
      console.error(error);
      toast(error.message, { type: "error" });
      throw new Error(error);
    }

    const offerMetadata = newMetadataUrl ?? offerData?.metadataURL;

    try {
      //   await mutateAsync({
      //     args: [
      //       offerId,
      //       offerData?.disable,
      //       offerData?.metadata?.offer?.name,
      //       offerMetadata,
      //       {
      //         admins: [],
      //         validators: [],
      //         adParameters: []
      //       },
      //       {
      //         admins: [],
      //         validators: [],
      //         adParameters: []
      //       }
      //     ]
      //   });

      const tx = prepareContractCall({
        contract: contract,
        method: "updateOffer",
        params: [
          // @ts-ignore
          offerId,
          offerData?.disable,
          offerData?.metadata?.offer?.name,
          offerMetadata,
          {
            admins: [],
            validators: [],
            adParameters: []
          },
          {
            admins: [],
            validators: [],
            adParameters: []
          }
        ]
      });

      // @ts-ignore
      await mutateAsync(tx);

      const relayerURL = config[chainId as number]?.relayerURL;
      if (relayerURL) {
        await fetch(`${relayerURL}/api/revalidate`, {
          method: "POST",
          body: JSON.stringify({
            tags: [`${chainId}-adOffer-${offerId}`]
          })
        });
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      throw new Error("Error updating offer");
    }

    setValueTelegramChannels(
      updatedMetadatas?.offer?.telegramIntegration?.telegramChannels?.join(", ")
    );
    setIsTelegramEnabled(updatedMetadatas?.offer?.telegramIntegration?.enabled);
    setTelegramChannels(updatedMetadatas?.offer?.telegramIntegration?.telegramChannels);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="dark:text-jacarta-100 text-jacarta-100">
          To integrate your offer with Telegram, you need to add the{" "}
          <Link
            href="https://telegram.me/SiBorgAdsBot"
            target="_blank"
            className="text-primaryPurple hover:text-opacity-80"
          >
            SiBorg Ads Bot
          </Link>{" "}
          to your channel.
        </span>
      </div>

      <Divider className="my-4" />

      <span className="text-lg font-semibold text-white">Update your Telegram Channels</span>

      <span className="dark:text-jacarta-100 text-jacarta-100">
        You can add multiple channels to your offer. The bot will automatically post the ads to the
        channels every day.
      </span>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Input
            className="max-w-lg"
            type="text"
            id="item-telegram"
            value={valueTelegramChannels}
            onChange={handleTelegramChannelsChange}
            placeholder="Telegram Channels (e.g., -124234, 234234)"
          />

          <Switch isSelected={isTelegramEnabled} onValueChange={setIsTelegramEnabled}>
            Enable Telegram
          </Switch>
        </div>

        <StyledWeb3Button
          isFullWidth={false}
          defaultText="Update Telegram Channels"
          onClick={async () => {
            await toast.promise(handleUpdateOffer(metadatas), {
              pending: "Waiting for confirmation 🕒",
              success: `Telegram channels updated successfully 🎉`,
              error: "Transaction rejected 🤯"
            });
          }}
          contractAddress={config[chainId as number]?.smartContracts?.DSPONSORADMIN?.address}
        />
      </div>
    </div>
  );
};

export default Telegram;
