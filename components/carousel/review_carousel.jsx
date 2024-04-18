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
  const [validate, setValidate] = useState({});
  const [comments, setComments] = useState({});
  const [refusedAdModalId, setRefusedAdModalId] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectedItem, setIsSelectedItem] = useState({});
 


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
  const handleCommentChange = (tokenId, value) => {
    setComments((currentComments) => ({
      ...currentComments,
      [tokenId]: value,
    }));
     setSelectedItems((currentItems) => {
       return currentItems.map((item) => {
         if (item.tokenId === tokenId) {
           return { ...item, reason: value }; 
         }
         return item;
       });
     });
     
     
      
     }

  const handleItemSubmit = async (approuved) => {
    let submissionArgs = [];
    
   for (const item of selectedItems) {
     let argObject = {
       ...item,
       ...(approuved && { reason: "" }), 
       validated: approuved,
     };
     submissionArgs.push(argObject);
   }
    
   console.log(submissionArgs, "ici");
     await handleSubmit(submissionArgs);
  };
  const openRefuseModal = () => {
    setRefusedAdModalId(true);
  
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
 const handleSelection = (item) => {
   setIsSelectedItem((prevState) => ({
     ...prevState, 
     [item.tokenId]: !prevState[item.tokenId], 
   }));

   
   setSelectedItems((previousItems) => {
    
     const isAlreadySelected = previousItems.some((i) => i.tokenId === item.tokenId);

     if (isAlreadySelected) {
  
       return previousItems.filter((i) => i.tokenId !== item.tokenId);
     } else {
     
       const newItems = item.adParametersKeys.map((key, idx) => ({
         offerId: item.offerId,
         tokenId: item.tokenId,
         proposalId: item.proposalIds[idx],
         adParameter: key,
         reason: comments[item.tokenId] || "",
       }));
       return [...previousItems, ...newItems];
     }
   });
 };


  if (pendingProposalData.length === 0) {
    return <div className="flex justify-center">No pendings ads...</div>;
  }
  return (
    <div>
      <div className={`fixed  bottom-0 blury-background left-0 right-0 px-4 py-3 animated-modalSelectedItemUp ${selectedItems.length === 0 && "animated-modalSelectedItemDown"}`}>
        <div className="dropdown-item mb-4 font-display   block w-full rounded-xl  text-left text-sm transition-colors dark:text-white">
          <span className="flex items-center justify-center gap-6">
            <span className="mr-4">
              I confirm that I have checked all the ads selected <span className="text-accent text-md ml-1">{Object.values(isSelectedItem).filter((value) => value === true).length}</span>{" "}
            </span>
            <input
              type="checkbox"
              name="check"
              className="checked:bg-accent checked:focus:bg-accent checked:hover:bg-accent after:bg-jacarta-400 bg-jacarta-100 relative h-4 w-7 cursor-pointer appearance-none rounded-lg border-none shadow-none after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:transition-all checked:bg-none checked:after:left-3.5 checked:after:bg-white focus:ring-transparent focus:ring-offset-0"
              onChange={() => handleInput(tokenId)}
              checked={validate[tokenId] || false}
            />
          </span>
        </div>

        <div className="flex justify-center  gap-4 flex-wrap">
          <Web3Button
            contractAddress="0xE442802706F3603d58F34418Eac50C78C7B4E8b3"
            action={() =>
              toast.promise(handleItemSubmit(true), {
                pending: "Waiting transaction confirmation",
                success: "Transaction confirmed 👌",
                error: "Transaction rejected 🤯",
              })
            }
            className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all ${!validate[tokenId] ? "btn-disabled" : "!bg-green !cursor-pointer"} `}
          >
            Validate
          </Web3Button>

          <Web3Button
            contractAddress="0xE442802706F3603d58F34418Eac50C78C7B4E8b3"
            action={() => openRefuseModal()}
            className={` !rounded-full !min-w-[100px] !py-3 !px-8 !text-center !font-semibold !text-white !transition-all ${!validate[tokenId] ? "btn-disabled" : "!bg-red !cursor-pointer"} `}
          >
            Reject
          </Web3Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[1.875rem] md:grid-cols-2 lg:grid-cols-4">
        {pendingProposalData.map((item) => {
          const { adParametersList, tokenId, proposalIds } = item;
          console.log(adParametersList, "linkURL");

          return (
            <article key={tokenId} className={`cursor-pointer  ${isSelectedItem[tokenId] ? "border-4 border-jacarta-100 rounded-2xl" : ""}`} onClick={() => handleSelection(item)}>
              <div className="dark:bg-jacarta-700 dark:border-jacarta-700 border-jacarta-100 rounded-2xl block border bg-white p-[1.1875rem] transition-shadow hover:shadow-lg text-jacarta-500">
                <figure className="flex justify-center">
                  <Image src={adParametersList?.imageURL ? adParametersList?.imageURL : "/"} alt="logo" height={230} width={230} className="rounded-[0.625rem] w-auto   h-[150px] object-contain" loading="lazy" />
                </figure>
                <div className="mt-4 flex items-center justify-between ">
                  <Link
                    href={adParametersList?.linkURL ? adParametersList.linkURL : "/"}
                    target="_blank"
                    className="font-display  text-jacarta-700 hover:text-accent text-base dark:text-white  overflow-hidden text-ellipsis whitespace-nowrap "
                  >
                    <span>{adParametersList?.linkURL}</span>
                  </Link>

                  <div className="dark:border-jacarta-600 ms-14 border-jacarta-100 flex items-center whitespace-nowrap rounded-md border py-1 px-2">
                    <span className="text-green text-sm font-medium tracking-tight">#{formatTokenId(tokenId)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs flex justify-between">
                  <span className="dark:text-jacarta-300 text-jacarta-500">Proposals : [{proposalIds.join("-")}]</span>

                  <span className="text-accent text-sm font-bold">🔍 Pending</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {refusedAdModalId && (
        <div className="modal fade show bloc">
          <AddProposalRefusedModal
            id={refusedAdModalId}
            selectedItems={selectedItems}
            handleCommentChange={handleCommentChange}
            handleItemSubmit={handleItemSubmit}
            closeRefuseModal={closeRefuseModal}
            successFullRefuseModal={successFullRefuseModal}
          />
        </div>
      )}
    </div>
  );
};

export default Review_carousel;
