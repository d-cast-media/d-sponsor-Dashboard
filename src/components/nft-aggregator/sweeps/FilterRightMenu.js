import React, { useState } from "react";

const FilterRightMenu = () => {
  const [activeMenu, setActiveMenu] = useState("7d");

  const menuItems = [
    { id: "7d", label: "7d" },
    { id: "24h", label: "24h" },
    { id: "6h", label: "6h" },
    { id: "1h", label: "1h" },
    { id: "30m", label: "30m" }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
  };

  return (
    <div className="flex flex-shrink-0 items-center text-xs font-medium text-jacarta-100 dark:text-jacarta-100 sm:text-sm">
      {menuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          className={`flex h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap border ${
            activeMenu === menuItem.id
              ? "border-transparent bg-primaryPurple text-white"
              : "border-jacarta-100 bg-white dark:border-jacarta-800 dark:bg-secondaryBlack"
          } p-3 ${menuItem.id === "7d" ? "first:rounded-l-lg" : ""} ${
            menuItem.id === "30m" ? "last:rounded-r-lg" : ""
          } hover:border-transparent hover:bg-primaryPurple hover:text-white sm:px-4 sm:py-2`}
          onClick={() => handleMenuClick(menuItem.id)}
        >
          {menuItem.label}
        </div>
      ))}
    </div>
  );
};

export default FilterRightMenu;
