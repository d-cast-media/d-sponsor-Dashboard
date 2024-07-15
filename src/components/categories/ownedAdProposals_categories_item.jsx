import { useContract, useContractWrite, useStorageUpload } from "@thirdweb-dev/react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/createPage/style.module.scss";
import OfferItem from "../cards/offerItem";
import Step1Mint from "../sliderForm/PageMint/Step_1_Mint";
import Step2Mint from "../sliderForm/PageMint/Step_2_Mint";
import Step3Mint from "../sliderForm/PageMint/Step_3_Mint";
import SliderForm from "../sliderForm/sliderForm";

import { useChainContext } from "../../contexts/hooks/useChainContext";

import PreviewModal from "../modal/previewModal";
import MainButton from "../buttons/mainButton";
import { activated_features } from "../../data/activated_features";

const OwnedAdProposals_categories_items = ({ data, isOwner }) => {
  const { currentChainObject } = useChainContext();
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectedItem, setIsSelectedItem] = useState({});
  const [validate, setValidate] = useState({});
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFirstSelection, setIsFirstSelection] = useState(true);

  const [successFullUpload, setSuccessFullUpload] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [link, setLink] = useState("");
  const [errors, setErrors] = useState({});
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [adParameters, setAdParameters] = useState([]);
  const [imageURLSteps, setImageURLSteps] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [imageUrlVariants, setImageUrlVariants] = useState([]);
  const stepsRef = useRef([]);
  const [numSteps, setNumSteps] = useState(2);
  const { contract: DsponsorAdminContract } = useContract(
    currentChainObject?.smartContracts?.DSPONSORADMIN?.address,
    currentChainObject?.smartContracts?.DSPONSORADMIN?.abi
  );
  const [isLoadingButton, setIsLoadingButton] = useState(false);

  const { mutateAsync: uploadToIPFS } = useStorageUpload();
  const { mutateAsync: submitAd } = useContractWrite(DsponsorAdminContract, "submitAdProposals");

  const handlePreviewModal = () => {
    if (successFullUpload) {
      setSuccessFullUpload(false);
      handleSelectionTokens();
    }

    setShowPreviewModal(!showPreviewModal);
  };

  const handleSelection = (item) => {
    setIsFirstSelection(false);
    setIsSelectedItem((prevState) => ({
      ...prevState,
      [item.id]: !prevState[item.id]
    }));

    setSelectedItems((previousItems) => {
      const isAlreadySelected = previousItems.some((i) => i.id === item.id);

      if (isAlreadySelected) {
        return previousItems.filter((i) => i.id !== item.id);
      } else {
        const newItems = item;
        return [...previousItems, newItems];
      }
    });
  };

  const handleLogoUpload = (file, index, step) => {
    if (file) {
      const newFiles = [...files];
      const newPreviewImages = [...previewImages];
      newFiles[index] = { file: file, index: index, offerIds: step.offerIds };
      newPreviewImages[index] = URL.createObjectURL(file);

      setFiles(newFiles);
      setPreviewImages(newPreviewImages);
    }
  };

  useEffect(() => {
    let isValid = true;
    let newErrors = {};

    if (files.length < imageURLSteps.length) {
      newErrors.imageError = "Image is missing.";
      isValid = false;
    }

    if (!link || !isValidURL(link)) {
      newErrors.linkError = "The link is missing or invalid.";
      isValid = false;
    }

    setValidate(isValid);
    setErrors(newErrors);
  }, [files, imageURLSteps.length, link]);

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSliderForm = () => {
    setShowSliderForm(!showSliderForm);

    const uniqueIds = new Set();
    const adDetails = {};
    for (const token of selectedItems) {
      for (const param of token.adParameters) {
        const paramId = param.adParameter.id;
        if (paramId && paramId !== "xSpaceId" && paramId !== "xCreatorHandle") {
          uniqueIds.add(paramId);
          adDetails[paramId] = adDetails[paramId] || new Set();
          adDetails[paramId].add(token.id);
        }
      }
    }

    for (const id in adDetails) {
      adDetails[id] = Array.from(adDetails[id]);
    }

    const uniqueIdsArray = Array.from(uniqueIds);
    setAdParameters(uniqueIdsArray);

    const imageURLStep = [];

    uniqueIdsArray
      .filter((id) => id.startsWith("imageURL"))
      .map((id) => {
        const variant = id.slice("imageURL-".length);
        imageURLStep.push({
          uniqueId: variant,
          offerIds: adDetails[id]
        });
      });
    const totalNumSteps = numSteps + imageURLStep.length;
    setImageURLSteps(imageURLStep);
    setNumSteps(totalNumSteps);
  };
  const handleSubmit = async () => {
    if (!validate) {
      return;
    }

    const selectedOfferIdItems = [];
    const selectedTokenIdItems = [];
    const adParametersItems = [];
    const dataItems = [];

    try {
      setIsLoadingButton(true);
      for (const item of selectedItems) {
        for (const args of item.adParameters) {
          if (args.adParameter.id !== "xSpaceId" && args.adParameter.id !== "xCreatorHandle") {
            selectedOfferIdItems.push(item.offerId);
            selectedTokenIdItems.push(item.tokenId);
            adParametersItems.push(args.adParameter.id);
          }
        }

        for (const file of files) {
          let uploadUrl;
          if (file.offerIds.includes(item.id)) {
            try {
              uploadUrl = await uploadToIPFS({
                data: [file.file],
                options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true }
              });
            } catch (error) {
              console.error("Erreur lors de l'upload à IPFS:", error);
              throw new Error("Upload to IPFS failed.");
            }
            dataItems.push(uploadUrl[0]);
          }
        }
        dataItems.push(link);
      }

      const argsAdSubmited = {
        offerId: selectedOfferIdItems,
        tokenId: selectedTokenIdItems,
        adParameters: adParametersItems,
        data: dataItems
      };
      await submitAd({ args: Object.values(argsAdSubmited) });
      setSuccessFullUpload(true);
    } catch (err) {
      console.error("Erreur lors de l'upload à Blockchain:", err);
      setIsLoadingButton(false);
      throw new Error("Upload to Blockchain failed.");
    } finally {
      setIsLoadingButton(false);
    }
  };

  const handleSelectionTokens = () => {
    setIsSelectionActive(!isSelectionActive);
    setShowSliderForm(false);
    setIsSelectedItem({});
    setSelectedItems([]);
    setImageURLSteps([]);
    setPreviewImages([]);
    setImageUrlVariants([]);
    setFiles([]);
    setNumSteps(2);
  };
  const successFullUploadModal = {
    title: "Submit ad",
    body: "Congratulations, you have proposed an ad. 🎉",
    subBody:
      "Ad assets submitted! They are now under review and awaiting validation by the offer creator.",
    buttonTitle: "Close",
    hrefButton: null
  };

  if (!data) {
    return (
      <div className="flex w-full justify-center">
        <Image src="/images/loading-bullet.svg" alt="icon" width={60} height={60} />
      </div>
    );
  }
  return (
    <>
      {/* <!-- Filter --> */}
      <div className="dark:bg-secondaryBlack dark:text-jacarta-100 rounded-2lg bg-white p-3 flex gap-4 justify-center items-center mb-6">
        <span>
          {" "}
          This section lists all owned tokens, either currently in a direct listing or not listed at
          all.
          <br />
        </span>
      </div>
      {/* <!-- Grid --> */}
      {data.length > 0 ? (
        <div className="flex flex-col justify-center items-center ">
          {" "}
          {isOwner && activated_features.canSeeSubmittedAds && (
            <div className="flex flex-col items-center justify-center">
              <div onClick={handleSelectionTokens}>
                <MainButton
                  isPurple={true}
                  isFullWidth={false}
                  text={
                    showSliderForm || isSelectionActive
                      ? "Close selection"
                      : "Submit ad for multiple tokens"
                  }
                />
              </div>
              {isSelectionActive && (
                <div className="dark:bg-secondaryBlack dark:text-jacarta-100 rounded-2lg bg-white p-3 flex gap-4 justify-center items-center mb-6">
                  <span>Select tokens to submit an ad on</span>
                </div>
              )}
            </div>
          )}
          {!showSliderForm && (
            <div className={`grid w-full grid-cols-1 gap-[1.875rem] md:grid-cols-2 lg:grid-cols-4`}>
              {data?.map((item, index) => {
                return isSelectionActive ? (
                  <div
                    onClick={() => handleSelection(item)}
                    key={index}
                    className={`  ${isSelectedItem[item.id] ? "border-4 border-jacarta-100 rounded-2xl " : ""} `}
                  >
                    <OfferItem
                      item={item}
                      isToken={true}
                      listingType={item?.marketplaceListings[0]?.listingType}
                      isListing={false}
                      isSelectionActive={isSelectionActive}
                      disableLink={isSelectionActive}
                      url={
                        !item.tokenData
                          ? `/${item?.chainConfig?.chainId}/offer/${item.offerId}/${item.tokenId}`
                          : `/${item?.chainConfig?.chainId}/offer/${item.offerId}/${item.tokenId}?tokenData=${item.tokenData}`
                      }
                      availableToSubmitAdFromOwnedTokens={true}
                    />
                  </div>
                ) : (
                  <OfferItem
                    item={item}
                    key={index}
                    isToken={true}
                    listingType={item?.marketplaceListings[0]?.listingType}
                    isListing={false}
                    isSelectionActive={isSelectionActive}
                    canSubmitAdFromProfileOwnedTokens={true}
                    url={
                      !item.tokenData
                        ? `/${item?.chainConfig?.chainId}/offer/${item.offerId}/${item.tokenId}`
                        : `/${item?.chainConfig?.chainId}/offer/${item.offerId}/${item.tokenId}?tokenData=${item.tokenData}`
                    }
                    availableToSubmitAdFromOwnedTokens={true}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 justify-center items-center">
          <span>No ad space yet...</span>
          <MainButton link={`/#hot-offers`} isPurple={true} text="Buy" />
        </div>
      )}
      {!showSliderForm && (
        <div
          className={`fixed dark:border-jacarta-500 border  bottom-0 blury-background left-0 right-0 px-4 py-3   ${
            isFirstSelection
              ? "hidden"
              : selectedItems?.length === 0
                ? "animated-modalSelectedItemDown"
                : "animated-modalSelectedItemUp"
          }`}
        >
          <div className="dropdown-item mb-4 font-display   block w-full rounded-xl  text-left text-sm transition-colors dark:text-white">
            <span className="flex items-center justify-center gap-6">
              <span className="mr-4">
                Ad Spaces selected :{" "}
                <span className="text-green text-md ml-1">
                  {Object.values(isSelectedItem).filter((value) => value === true).length}
                </span>{" "}
              </span>
            </span>
          </div>

          <div className="flex justify-center  gap-4 flex-wrap">
            <button
              className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all !bg-green !cursor-pointer `}
              onClick={handleSliderForm}
            >
              Continue
            </button>

            <button
              className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all !bg-red !cursor-pointer `}
              onClick={handleSelectionTokens}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showSliderForm && (
        <div>
          <SliderForm
            styles={styles}
            files={files}
            handlePreviewModal={handlePreviewModal}
            stepsRef={stepsRef}
            numSteps={numSteps}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
          >
            {currentSlide === 0 && (
              <Step1Mint
                stepsRef={stepsRef}
                styles={styles}
                adParameters={adParameters}
                setImageUrlVariants={setImageUrlVariants}
                currentSlide={currentSlide}
                numSteps={numSteps}
              />
            )}

            <>
              {imageURLSteps.map((step, index) => (
                <>
                  {currentSlide === index + 1 && (
                    <Step3Mint
                      key={step.uniqueId}
                      stepsRef={stepsRef}
                      currentStep={index + 2}
                      offerIds={step.offerIds}
                      id={step.uniqueId}
                      styles={styles}
                      file={files[index]}
                      previewImage={previewImages[index]}
                      handleLogoUpload={(file) => handleLogoUpload(file, index, step)}
                      currentSlide={currentSlide}
                      numSteps={numSteps}
                    />
                  )}
                </>
              ))}
            </>

            {currentSlide === imageURLSteps.length + 1 && (
              <Step2Mint
                stepsRef={stepsRef}
                styles={styles}
                setLink={setLink}
                link={link}
                currentSlide={currentSlide}
                numSteps={numSteps}
              />
            )}
          </SliderForm>
        </div>
      )}
      {showPreviewModal && (
        <div className="modal fade show bloc">
          <PreviewModal
            handlePreviewModal={handlePreviewModal}
            handleSubmit={handleSubmit}
            link={link}
            imageUrlVariants={imageUrlVariants}
            imageURLSteps={imageURLSteps}
            name={true}
            description={true}
            previewImage={previewImages}
            errors={errors}
            successFullUpload={successFullUpload}
            validate={validate}
            buttonTitle="Submit ad"
            modalTitle="Ad Space Preview"
            successFullUploadModal={successFullUploadModal}
            isLoadingButton={isLoadingButton}
            multipleAdsSubmission={true}
          />
        </div>
      )}
    </>
  );
};

export default OwnedAdProposals_categories_items;
