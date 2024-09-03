import React, { useEffect, useState, useRef, useMemo } from "react";
import Meta from "@/components/Meta";
import Image from "next/image";
import "react-datepicker/dist/react-datepicker.css";
import {
  useAddress,
  useContract,
  useContractRead,
  useContractWrite,
  useStorageUpload
} from "@thirdweb-dev/react";
import styles from "@/styles/style.module.scss";
import AdSubmission from "@/components/features/token/accordion/AdSubmission";
import OfferType from "@/components/features/createOffer/OfferType";
import OfferName from "@/components/features/createOffer/OfferName";
import OfferImageAndURL from "@/components/features/createOffer/OfferImageAndURL";
import OfferValidity from "@/components/features/createOffer/OfferValidity";
import config from "@/config/config";
import CarouselForm from "@/components/ui/misc/CarouselForm";
import { useSwitchChainContext } from "@/hooks/useSwitchChainContext";
import { useRouter } from "next/router";
import { Address } from "thirdweb";
import { features } from "@/data/features";

export type Currency = {
  address: Address | string;
  decimals: number;
  symbol: string;
};

const CreateOffer = () => {
  const router = useRouter();
  const chainId = router.query?.chainId;

  const initialCurrencies = useMemo(
    () => config[parseInt(chainId as string)]?.smartContracts?.currencies || {},
    [chainId]
  ) as { [key: string]: Currency };

  const currencies = Object?.entries(initialCurrencies)
    ?.map((currency) => {
      if (!features?.canAcceptNativeTokens && currency[0] === "NATIVE") {
        return null;
      }

      return currency?.[1];
    })
    ?.filter((currency) => currency !== null);

  const [files, setFiles] = useState<any[]>([]);
  const { mutateAsync: upload } = useStorageUpload();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [link, setLink] = useState<string | null>(null);
  const [errors, setErrors] = useState({});
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState(1);
  const [selectedRoyalties, setSelectedRoyalties] = useState(10);
  const [validate, setValidate] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [successFullUpload, setSuccessFullUpload] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState([0]);
  const [selectedParameter, setSelectedParameter] = useState<string[]>(["imageURL-1:1", "linkURL"]);
  const [displayedParameter, setDisplayedParameter] = useState([]);
  const [imageRatios, setImageRatios] = useState(["1:1"]);
  const [terms, setTerms] = useState<string | undefined>(undefined);
  const [minterAddress, setMinterAddress] = useState<Address | null>(null);

  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<Address>(currencies?.[0]?.address as Address);
  const [customTokenAddress, setCustomTokenAddress] = useState<Address | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies?.[0]);
  const [mounted, setMounted] = useState(false);

  const { contract: tokenContractAsync } = useContract(tokenAddress, "token");
  const { data: customTokenSymbol } = useContractRead(tokenContractAsync, "symbol");
  const { data: customTokenDecimals } = useContractRead(tokenContractAsync, "decimals");

  useEffect(() => {
    if (!mounted && currencies && currencies?.length > 0) {
      setTokenAddress(currencies?.[0]?.address as Address);
      setTokenDecimals(currencies?.[0]?.decimals);
      setTokenSymbol(currencies?.[0]?.symbol);
      setMounted(true);
    }
  }, [currencies, mounted]);

  const [customCurrencyEnabled, setCustomCurrencyEnabled] = React.useState<boolean>(false);

  useEffect(() => {
    if (customCurrencyEnabled) {
      setTokenAddress(customTokenAddress as Address);
      setTokenDecimals(null);
      setTokenSymbol(null);
    } else {
      setTokenAddress(selectedCurrency?.address as Address);
    }
  }, [customCurrencyEnabled, customTokenAddress, selectedCurrency]);

  const { setSelectedChain } = useSwitchChainContext();

  useEffect(() => {
    const currencies = Object.entries(
      config[chainId as string]?.smartContracts?.currencies || {}
    ) as any;

    const [, { symbol, decimals }] = currencies.find(
      ([, value]) => value?.address?.toLowerCase() === tokenAddress?.toLowerCase()
    ) ?? ["", {}];

    if (symbol && decimals) {
      setTokenSymbol(symbol);
      setTokenDecimals(decimals);
    } else {
      if (customTokenSymbol) {
        setTokenSymbol(customTokenSymbol);
      } else {
        setTokenSymbol(null);
      }

      if (customTokenDecimals) {
        setTokenDecimals(customTokenDecimals);
      } else {
        setTokenDecimals(null);
      }
    }
  }, [chainId, tokenAddress, customTokenDecimals, customTokenSymbol]);

  const address = useAddress();

  const { contract: DsponsorAdminContract } = useContract(
    config[parseFloat(chainId as string)]?.smartContracts?.DSPONSORADMIN?.address,
    config[parseFloat(chainId as string)]?.smartContracts?.DSPONSORADMIN?.abi
  );
  const { mutateAsync: createDSponsorNFTAndOffer } = useContractWrite(
    DsponsorAdminContract,
    "createDSponsorNFTAndOffer"
  );

  useEffect(() => {
    if (!address) return;
    setMinterAddress(address as Address);
  }, [address]);

  const [name, setName] = useState("");
  const stepsRef = useRef([]);
  const { ethers } = require("ethers");

  useEffect(() => {
    if (!chainId) return;
    setSelectedChain(config[parseFloat(chainId as string)]?.network);
  }, [chainId, setSelectedChain]);

  const handleUnitPriceChange = (e) => {
    const { value } = e.target;

    const price = value;

    setSelectedUnitPrice(value === "" ? null : price);
  };

  const handleRoyaltiesChange = (e) => {
    let { value } = e.target;
    setSelectedRoyalties(value);
  };

  const handleLogoUpload = (file) => {
    if (file) {
      setFiles([file]);
      setPreviewImages([URL.createObjectURL(file)]);
    }
  };

  useEffect(() => {
    let isValid = true;
    let newErrors: any = {};

    if (!name) {
      newErrors.nameError = "Name is missing.";
      isValid = false;
    }

    if (!minterAddress) {
      newErrors.addressError = "Address is missing.";
      isValid = false;
    }

    if (!link) {
      newErrors.linkError = "The link is missing or invalid.";
      isValid = false;
    }

    if (!description) {
      newErrors.descriptionError = "Description is missing.";
      isValid = false;
    }

    if (files.length === 0) {
      newErrors.imageError = "Image is missing.";
      isValid = false;
    }

    if (!tokenAddress) {
      newErrors.tokenError = "Token contract is missing.";
      isValid = false;
    }

    const currentDate = new Date();
    const yesterday = new Date(currentDate.setDate(currentDate.getDate() - 1));

    if (!startDate) {
      newErrors.startDateError = "Start date is missing.";
      isValid = false;
    } else if (new Date(startDate) < yesterday) {
      newErrors.startDateError = "Start date cannot be in the past.";
      isValid = false;
    }

    for (let i = 0; i < selectedIntegration.length; i++) {
      if (imageRatios[i] === "custom") {
        newErrors.imageRatioError = "Image ratio is missing.";
        isValid = false;
      }
    }

    if (!endDate) {
      newErrors.endDateError = "End date is missing.";
      isValid = false;
    } else if (new Date(endDate) < yesterday) {
      newErrors.endDateError = "End date cannot be in the past.";
      isValid = false;
    }

    if (!tokenSymbol || !tokenDecimals) {
      newErrors.currencyError = "Token contract is invalid.";
      newErrors.tokenError = "Token contract is invalid.";
      isValid = false;
    }

    if (tokenDecimals) {
      if (selectedUnitPrice < 1 * 10 ** -tokenDecimals) {
        newErrors.unitPriceError = `Unit price must be at least ${1 * 10 ** -tokenDecimals}.`;
        isValid = false;
      }
    }

    if (selectedNumber < 0) {
      newErrors.numberError = "Number of ad spaces is missing or invalid.";
      isValid = false;
    }
    if (selectedParameter.length === 0) {
      newErrors.typeAdError = "Type of ad spaces is missing or invalid.";
      isValid = false;
    }

    if (selectedCurrency?.address === "custom" && customTokenAddress === null) {
      newErrors.currencyError = "Custom contract is missing or invalid.";
      isValid = false;
    }

    if (selectedRoyalties < 0.01 || selectedRoyalties > 100) {
      newErrors.royaltyError =
        "Royalties are missing or invalid. They should be between 0.01% and 100%.";
      isValid = false;
    }

    setValidate(isValid);
    setErrors(newErrors);
  }, [
    customTokenAddress,
    description,
    endDate,
    files.length,
    imageRatios,
    link,
    minterAddress,
    name,
    selectedCurrency,
    selectedIntegration.length,
    selectedNumber,
    selectedParameter.length,
    selectedRoyalties,
    selectedUnitPrice,
    startDate,
    tokenDecimals,
    tokenAddress,
    tokenSymbol
  ]);

  const handlePreviewModal = () => {
    setShowPreviewModal(!showPreviewModal);
    setSuccessFullUpload(false);
  };

  const handleSubmit = async (userMinterAddress) => {
    try {
      let paramsFormated: any[] = [];

      selectedParameter.forEach((param) => {
        const a = param.split("-");
        const c = a.join("-");
        paramsFormated.push(c);
      });
      let uniqueParams = [...new Set(paramsFormated)];

      const uploadUrl = await upload({
        data: [files[0]],
        options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true }
      });

      if (name && link) {
        onUpload(name, link);
      } else {
        console.error("Missing name or link");
      }

      const jsonMetadata = JSON.stringify({
        creator: {
          name: "",
          description: "",
          image: "",
          external_link: "",
          categories: ["dApp", "social", "media", "education"]
        },
        offer: {
          name: name,
          description: description,
          image: uploadUrl[0] ?? "",
          terms: terms,
          external_link: link,
          valid_from: startDate || "1970-01-01T00:00:00Z",
          valid_to: endDate || "2100-01-01T00:00:00Z",
          categories: ["Community", "NFT", "Crypto"],
          token_metadata: {}
        }
      });

      const jsonContractURI = JSON.stringify({
        name: name,
        description: description,
        image: uploadUrl[0] ?? "",
        external_link: link,
        collaborators: [userMinterAddress]
      });

      const jsonMetadataURL = await upload({
        data: [jsonMetadata],
        options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true }
      });

      const jsonContractURIURL = await upload({
        data: [jsonContractURI],
        options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true }
      });

      const jsonIpfsLinkContractURI = jsonContractURIURL[0];
      const jsonIpfsLinkMetadata = jsonMetadataURL[0];

      const args = [
        JSON.stringify({
          name: name, // name
          symbol: "DSPONSORNFT", // symbol
          baseURI: "https://api.dsponsor.com/tokenMetadata/", // baseURI
          contractURI: jsonIpfsLinkContractURI, // contractURI from json
          minter: userMinterAddress,
          maxSupply: selectedNumber, // max supply
          forwarder: "0x0000000000000000000000000000000000000000", // forwarder
          initialOwner: userMinterAddress, // owner
          royaltyBps: (parseFloat(selectedRoyalties.toString()) * 100).toFixed(0).toString(), // royalties
          currencies: [tokenAddress], // accepted token
          prices: [
            ethers.utils.parseUnits(
              parseFloat(selectedUnitPrice.toString())
                .toFixed(tokenDecimals as number)
                .toString(),
              tokenDecimals
            )
          ], // prices with decimals
          allowedTokenIds: Array.from({ length: selectedNumber }, (_, i) => i) // allowed token ids
        }),
        JSON.stringify({
          name: name, // name
          offerMetadata: jsonIpfsLinkMetadata, // rulesURI

          options: {
            admins: [userMinterAddress], // admin
            validators: [], // validator
            adParameters: uniqueParams // ad parameters
          }
        })
      ];

      const preparedArgs = [Object.values(JSON.parse(args[0])), Object.values(JSON.parse(args[1]))];

      await createDSponsorNFTAndOffer({ args: preparedArgs });

      const relayerURL = config[parseFloat(chainId as string)]?.relayerURL;
      if (relayerURL) {
        await fetch(`${relayerURL}/api/revalidate`, {
          method: "POST",
          body: JSON.stringify({
            tags: [`${chainId}-adOffers`, `${chainId}-userAddress-${userMinterAddress}`]
          })
        });
      }
      setSuccessFullUpload(true);

      // reset form data
      setName("");
      setDescription("");
      setLink("");
      setFiles([]);
      setPreviewImages([]);
      setStartDate(new Date());
      setEndDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
      setSelectedNumber(1);
      setSelectedUnitPrice(1);
      setSelectedCurrency(currencies?.[0]);
      setCustomTokenAddress(undefined);
      setSelectedParameter(["imageURL-1:1", "linkURL"]);
      setSelectedIntegration([0]);
      setSelectedRoyalties(10);
      setTokenAddress(currencies?.[0]?.address as Address);
      setCustomTokenAddress(undefined);
      setCurrentSlide(0);
    } catch (error) {
      setSuccessFullUpload(false);
      throw error;
    }
  };

  const onUpload = (updatedName, updatedLink) => {
    setName(updatedName);
    setLink(updatedLink);
  };

  const numSteps = 4;
  const successFullUploadModal = {
    body: "Your offer has been created successfully",
    subBody:
      "Find the integration code to copy/paste onto your platform in your offer management page",
    buttonTitle: "Manage Spaces",
    hrefButton: `/profile/${minterAddress}`
  };
  const metadata = {
    title: "Create Offer || SiBorg Ads - The Web3 Monetization Solution",
    description:
      "SiBorg Ads is a platform that connects content creators with sponsors. Our platform helps creators monetize their content and helps sponsors find creators to promote their products."
  };

  return (
    <div>
      <Meta {...metadata} />
      {/* <!-- Create --> */}
      <section className="relative py-24">
        <picture className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
          <Image
            width={1519}
            height={773}
            priority
            src="/images/gradients/gradient_light.jpg"
            alt="gradient"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="container">
          <h1 className="font-display text-jacarta-900 pt-16 pb-8 text-center text-3xl font-medium dark:text-white">
            Create ad space offer
          </h1>

          <div className="mx-auto max-w-[48.125rem]" style={{ maxWidth: "48.125rem" }}>
            <p className="text-center pt- pb-12 dark:text-white">
              Fund your activities by selling ad space tokens. Sponsors who purchase these tokens
              gain the exclusive right to propose ads on your platform, whether it&apos;s your
              website or another location of your choice. You retain full control to approve or
              reject any ads.
            </p>
          </div>
        </div>
        <CarouselForm
          handlePreviewModal={handlePreviewModal}
          numSteps={numSteps}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
        >
          <OfferType
            setSelectedParameter={setSelectedParameter}
            selectedNumber={selectedNumber}
            setSelectedNumber={setSelectedNumber}
            setDisplayedParameter={setDisplayedParameter}
            selectedIntegration={selectedIntegration}
            setSelectedIntegration={setSelectedIntegration}
            imageRatios={imageRatios}
            setImageRatios={setImageRatios}
            numSteps={numSteps}
            currentSlide={currentSlide}
          />

          <OfferName
            stepsRef={stepsRef}
            styles={styles}
            setName={setName}
            name={name}
            setDescription={setDescription}
            description={description}
            numSteps={numSteps}
            currentSlide={currentSlide}
          />

          <OfferImageAndURL
            stepsRef={stepsRef}
            styles={styles}
            setLink={setLink}
            link={link ?? ""}
            terms={terms ?? ""}
            setTerms={setTerms}
            previewImage={previewImages}
            file={files}
            handleLogoUpload={handleLogoUpload}
            numSteps={numSteps}
            currentSlide={currentSlide}
          />

          <OfferValidity
            stepsRef={stepsRef}
            styles={styles}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            selectedUnitPrice={selectedUnitPrice}
            handleUnitPriceChange={handleUnitPriceChange}
            numSteps={numSteps}
            currentSlide={currentSlide}
            currencies={currencies}
            tokenDecimals={tokenDecimals as number}
            tokenSymbol={tokenSymbol as string}
            tokenAddress={tokenAddress}
            customTokenAddress={customTokenAddress as Address}
            setCustomTokenAddress={setCustomTokenAddress}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            handleRoyaltiesChange={handleRoyaltiesChange}
            selectedRoyalties={selectedRoyalties}
            customCurrencyEnabled={customCurrencyEnabled}
            setCustomCurrencyEnabled={setCustomCurrencyEnabled}
          />
        </CarouselForm>
      </section>
      {showPreviewModal && (
        <div className="modal fade show bloc">
          <AdSubmission
            handlePreviewModal={handlePreviewModal}
            handleSubmit={handleSubmit}
            name={name}
            link={link as string}
            description={description}
            startDate={startDate}
            endDate={endDate}
            selectedNumber={selectedNumber}
            selectedUnitPrice={selectedUnitPrice}
            tokenSymbol={tokenSymbol as string}
            selectedRoyalties={selectedRoyalties}
            imageURLSteps={["imageURL"]}
            previewImage={previewImages}
            terms={terms}
            selectedParameter={selectedParameter}
            displayedParameter={displayedParameter}
            validate={validate}
            errors={errors}
            successFullUpload={successFullUpload}
            address={minterAddress as Address}
            createOffer={true}
            buttonTitle="Create ad space offer"
            modalTitle="Ad Space Offer "
            successFullUploadModal={successFullUploadModal}
          />
        </div>
      )}

      {/* <!-- end create --> */}
    </div>
  );
};

export default CreateOffer;
