import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import "tippy.js/dist/tippy.css";
import Link from "next/link";
import Tippy from "@tippyjs/react";
import { MdKeyboardArrowRight, MdKeyboardArrowLeft } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Web3Button } from "@thirdweb-dev/react";
import AddProposalRefusedModal from "../modal/adProposalRefusedModal";

const Review_carousel = ({ handleSubmit, pendingProposalData, successFullRefuseModal }) => {
  const [data, setData] = useState([]);
  const [validate, setValidate] = useState({});
  const [comments, setComments] = useState({});
  const [refusedAdModalId, setRefusedAdModalId] = useState(null);
  const [offerId, setOfferId] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [recordsProposalId, setRecordsProposalId] = useState(null);

  useEffect(() => {
    const initialValidateStates = {};
    console.log("pendingProposalData", pendingProposalData);
    pendingProposalData.forEach((item) => {
      initialValidateStates[item.tokenId] = false;
    });
    setValidate(initialValidateStates);
  }, [ pendingProposalData]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [copied]);

  const handleInput = (id) => {
    setValidate((currentState) => ({
      ...currentState,
      [id]: !currentState[id],
    }));
  };
  const handleCommentChange = (id, value) => {
    setComments((currentComments) => ({
      ...currentComments,
      [id]: value,
    }));
  };
  const handleItemSubmit = async (offerId, tokenId, item, approuved) => {
    
    const submissionArgs = [
      {
        offerId: offerId,
        tokenId: tokenId,
        proposalId: item[0].proposalId,
        adParameter: "imageURL",
        validated: approuved,
        reason: comments[tokenId] || "",
      },
      {
        offerId: offerId,
        tokenId: tokenId,
        proposalId: item[1].proposalId,
        adParameter: "linkURL",
        validated: approuved,
        reason: comments[tokenId] || "",
      },
    ];
console.log(submissionArgs);
    await handleSubmit(submissionArgs);
  };
  const openRefuseModal = (offerId, tokenId, recordsProposalId) => {
    setRefusedAdModalId(tokenId);
    setOfferId(offerId);
    setTokenId(tokenId);
    setRecordsProposalId(recordsProposalId);
  };
 function formatTokenId(str) {
   if (str.length <= 6) {
     return str;
   }
   return str.slice(0, 3) + "..." + str.slice(-3);
 }
  const closeRefuseModal = () => {
    setRefusedAdModalId(null);
  };
  if (pendingProposalData.length === 0) {
    return <div className="flex justify-center">No pendings ads...</div>;
  }
  return (
    <>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar]}
        spaceBetween={30}
        loop={pendingProposalData.length > 2}
        slidesPerView="auto"
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          900: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          1000: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
        }}
        navigation={
          pendingProposalData.length > 2
            ? {
                nextEl: ".bids-swiper-button-next",
                prevEl: ".bids-swiper-button-prev",
              }
            : false
        }
        className=" card-slider-4-columns !py-5"
      >
        {pendingProposalData.map((item) => {
          const { ads } = item;

          return (
            <div key={tokenId}>
              <SwiperSlide className="text-white">
                <article>
                  <div className="dark:bg-jacarta-700 flex dark:border-jacarta-700 border-jacarta-100 flex-col md:flex-row rounded-2xl  border bg-white p-[1.1875rem] transition-shadow hover:shadow-lg text-jacarta-500">
                    <div className="dark:bg-jacarta-700 w-full md:w-[250px] dark:border-jacarta-600 border-jacarta-100   items-center justify-center rounded-lg border bg-white py-1.5 px-4">
                      <figure className="mb-4 flex flex-col">
                        <span className="dark:text-jacarta-200 mb-1">Image :</span>
                        <Link href={`/item/${ads[0].offerId}/${ads[0].tokenId}`}>
                          <Image src={ads[0].adParameters?.imageURL} alt="logo" height={230} width={230} className="rounded-[0.625rem] w-auto   h-[150px] object-contain" loading="lazy" />
                        </Link>
                      </figure>
                      <div className="mb-4 flex flex-col">
                        <span className="dark:text-jacarta-200 mb-1">Redirection link :</span>
                        <Tippy hideOnClick={false} content={copied ? <span>copied</span> : <span>copy</span>}>
                          <button className="js-copy-clipboard flex text-white max-w-[auto] select-none overflow-hidden text-ellipsis whitespace-nowrap">
                            <CopyToClipboard text="userId" onCopy={() => setCopied(true)}>
                              <span>{ads[1].adParameters?.linkURL}</span>
                            </CopyToClipboard>
                          </button>
                        </Tippy>
                      </div>
                    </div>

                    <div className="mt-4 flex  flex-col md:pl-8 pl-0 justify-between">
                      <div className="flex flex-col ">
                        <Link href={`/item/${ads[0].offerId}/${ads[0].tokenId}`} className="mb-4">
                          <span className="font-display text-jacarta-700 hover:text-accent text-base dark:text-white">
                            Space <span className="text-accent"> #{formatTokenId(ads[0].tokenId)} </span>{" "}
                          </span>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="dropdown-item mb-4 font-display dark:bg-jacarta-600 hover:bg-jacarta-50 block w-full rounded-xl pr-5 py-2 text-left text-sm transition-colors dark:text-white">
                          <span className="flex items-center justify-between gap-2">
                            <span className="pl-5">I confirm that I have check the image and the linkURL </span>
                            <input
                              type="checkbox"
                              name="check"
                              className="checked:bg-accent checked:focus:bg-accent checked:hover:bg-accent after:bg-jacarta-400 bg-jacarta-100 relative h-4 w-7 cursor-pointer appearance-none rounded-lg border-none shadow-none after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:transition-all checked:bg-none checked:after:left-3.5 checked:after:bg-white focus:ring-transparent focus:ring-offset-0"
                              onChange={() => handleInput(ads[0].tokenId)}
                              checked={validate[ads[0].tokenId] || false}
                            />
                          </span>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="flex items-start gap-4 flex-wrap">
                            <Web3Button
                              contractAddress="0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09"
                              action={() =>
                                toast.promise(handleItemSubmit(ads[0].offerId, ads[0].tokenId, item.ads, true), {
                                  pending: "Waiting transaction confirmation",
                                  success: "Transaction confirmed 👌",
                                  error: "Transaction rejected 🤯",
                                })
                              }
                              className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all ${!validate[ads[0].tokenId] ? "btn-disabled" : "!bg-accent !cursor-pointer"} `}
                            >
                              Validate
                            </Web3Button>

                            <Web3Button
                              contractAddress="0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09"
                              action={() => openRefuseModal(ads[0].offerId, ads[0].tokenId, item.ads)}
                              className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all ${!validate[ads[0].tokenId] ? "btn-disabled" : "!bg-red !cursor-pointer"} `}
                            >
                              Reject
                            </Web3Button>

                            {/* <Link href="{hrefButton}">
                              <button className="!rounded-full !py-3 !px-8 !text-center !font-semibold !text-white !transition-all !bg-accent !cursor-pointer">Youhou</button>
                            </Link> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            </div>
          );
        })}
      </Swiper>

      {/* <!-- Slider Navigation --> */}
      <div className="group bids-swiper-button-prev swiper-button-prev shadow-white-volume absolute !top-1/2 !-left-4 z-10 -mt-6 flex !h-12 !w-12 cursor-pointer items-center justify-center rounded-full bg-white p-3 text-jacarta-700 text-xl sm:!-left-6 after:hidden">
        <MdKeyboardArrowLeft />
      </div>
      <div className="group bids-swiper-button-next swiper-button-next shadow-white-volume absolute !top-1/2 !-right-4 z-10 -mt-6 flex !h-12 !w-12 cursor-pointer items-center justify-center rounded-full bg-white p-3 text-jacarta-700 text-xl sm:!-right-6 after:hidden">
        <MdKeyboardArrowRight />
      </div>
      {refusedAdModalId && (
        <div className="modal fade show bloc">
          <AddProposalRefusedModal
            id={refusedAdModalId}
            offerId={offerId}
            tokenId={tokenId}
            recordsProposalId={recordsProposalId}
            comments={comments[refusedAdModalId]}
            handleCommentChange={handleCommentChange}
            handleItemSubmit={handleItemSubmit}
            closeRefuseModal={closeRefuseModal}
            successFullRefuseModal={successFullRefuseModal}
          />
        </div>
      )}
    </>
  );
};

export default Review_carousel;
