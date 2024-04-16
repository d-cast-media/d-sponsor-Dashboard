import Link from "next/link";
import React from "react";
import { useSelector, useDispatch} from "react-redux";
import { buyModalHide } from "../../redux/counterSlice";
import { Confirm_checkout } from "../metamask/Metamask";
import Image from "next/image";
import { Web3Button } from "@thirdweb-dev/react";
import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BuyModal = ({formatTokenId, finalPrice,successFullUpload, userBalance, successFullBuyModal, price,tokenId, selectedCurrency, selectedRoyalties, name, image, handleSubmit, handleBuyModal }) => {
  const { buyModal } = useSelector((state) => state.counter);
  const dispatch = useDispatch();
  const [validate, setValidate] = useState(false);

  const handleTermService = (e) => {
    console.log(validate);
    setValidate(e.target.checked);
  };
  return (
    <div>
      {/* <!-- Buy Now Modal --> */}
      <div className="modal-dialog max-w-2xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="buyNowModalLabel">
              {!successFullUpload ? "Complete checkout" : successFullBuyModal.title}
            </h5>
            <button type="button" className="btn-close" onClick={handleBuyModal}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="fill-jacarta-700 h-6 w-6 dark:fill-white">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
              </svg>
            </button>
          </div>

          {/* <!-- Body --> */}
          {!successFullUpload ? (
            <div className="modal-body p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-jacarta-700 text-sm font-semibold dark:text-white">Space #{formatTokenId(tokenId)}</span>
                <span className="font-display text-jacarta-700 text-sm font-semibold dark:text-white">Subtotal</span>
              </div>

              <div className="dark:border-jacarta-600 border-jacarta-100 relative flex items-center border-t border-b py-4">
                <figure className="mr-5 self-start">
                  <Image width={150} height={150} src={image} alt="logo" className="rounded-2lg" loading="lazy" />
                </figure>

                <div>
                  <a href="collection.html" className="text-accent text-sm">
                    0X0000000
                  </a>
                  <h3 className="font-display text-jacarta-700 mb-1 text-base font-semibold dark:text-white">{name}</h3>
                  <div className="flex flex-wrap items-center">
                    <span className="dark:text-jacarta-300 text-jacarta-500 mr-1 block text-sm">Protocol fees: 4 %</span>
                    {/* <span data-tippy-content="The creator of this collection will receive 5% of the sale total from future sales of this item.">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="dark:fill-jacarta-300 fill-jacarta-700 h-4 w-4">
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" />
                      </svg>
                    </span> */}
                  </div>
                </div>

                <div className="ml-auto">
                  <span className="mb-1 flex items-center whitespace-nowrap">
                    <span data-tippy-content="ETH">
                      <svg className="h-4 w-4">
                        <use xlinkHref="/icons.svg#icon-ETH"></use>
                      </svg>
                    </span>
                    <span className="dark:text-jacarta-100 text-sm font-medium tracking-tight">
                      {price} {selectedCurrency}
                    </span>
                  </span>
                  {/* <div className="dark:text-jacarta-300 text-right text-sm">$130.82</div> */}
                </div>
              </div>

              {/* <!-- Total --> */}
              <div className="dark:border-jacarta-600 border-jacarta-100 mb-2 flex items-center justify-between border-b py-2.5">
                <span className="font-display text-jacarta-700 hover:text-accent font-semibold dark:text-white">Total</span>
                <div className="ml-auto">
                  <span className="flex items-center whitespace-nowrap">
                    <span data-tippy-content="ETH">
                      <svg className="h-4 w-4">
                        <use xlinkHref="/icons.svg#icon-ETH"></use>
                      </svg>
                    </span>
                    <span className="text-green font-medium tracking-tight">
                      {finalPrice} {selectedCurrency}
                    </span>
                  </span>
                  {/* <div className="dark:text-jacarta-300 text-right">$130.82</div> */}
                </div>
              </div>

              {/* <!-- Terms --> */}
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="buyNowTerms"
                  className="checked:bg-accent dark:bg-jacarta-600 text-accent border-jacarta-200 focus:ring-accent/20 dark:border-jacarta-500 h-5 w-5 self-start rounded focus:ring-offset-0"
                  onClick={handleTermService}
                />
                <label htmlFor="buyNowTerms" className="dark:text-jacarta-200 text-sm">
                  By checking this box, I agree to {"DSponsor's"}{" "}
                  <Link href="#" className="text-accent">
                    Terms of Service
                  </Link>
                </label>
              </div>
            </div>
          ) : (
            <div className="modal-body p-6">
              <div className="flex flex-col gap-2">
                <div className="flex gap-4">
                  <p>{successFullBuyModal.body} </p>
                  <div className="dark:border-jacarta-600 bg-green   flex h-6 w-6 items-center justify-center rounded-full border-2 border-white" data-tippy-content="Verified Collection">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="h-[.875rem] w-[.875rem] fill-white">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                    </svg>
                  </div>
                </div>
                {successFullBuyModal.subBody && <p>{successFullBuyModal.subBody} </p>}
              </div>
            </div>
          )}

          {/* <!-- end body --> */}

          <div className="modal-footer">
            <div className="flex items-center justify-center space-x-4">
              {!successFullUpload ? (
                <Web3Button
                  contractAddress="0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09"
                  action={() => {
                    toast.promise(handleSubmit, {
                      pending: "Waiting transaction confirmation",
                      success: "Transaction confirmed 👌",
                      error: "Transaction rejected 🤯",
                    });
                  }}
                  className={` !rounded-full !py-3 !px-8 !text-center !font-semibold !text-white !transition-all ${!validate || !userBalance ? "btn-disabled" : "!bg-accent !cursor-pointer"} `}
                  disabled={!validate}
                >
                  Confirm checkout
                </Web3Button>
              ) : (
                <Link href={successFullBuyModal.hrefButton}>
                  <button className="!rounded-full !py-3 !px-8 !text-center !font-semibold !text-white !transition-all !bg-accent !cursor-pointer">{successFullBuyModal.buttonTitle}</button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyModal;
