import { DocType } from "@/pages";
import { AnimatePresence, motion } from "framer-motion";
import React, { Dispatch, SetStateAction } from "react";

interface Props {
  docTypes: DocType[];
  setSelectedDocType: Dispatch<SetStateAction<DocType>>;
}

function Select(props: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex relative">
      <button
        className="flex cursor-pointer items-center space-x-2 p-2 rounded-lg border border-gray-300"
        onClick={() => setOpen(!open)}
      >
        <span>Document Type</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`${open ? "rotate-180" : ""} w-4 h-4 duration-300`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {open && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, type: "spring" }}
            exit={{ opacity: 0 }}
            className="absolute shadow-black/50 top-full left-0 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20"
          >
            <ul className="py-2">
              {props.docTypes.map((doc) => (
                <li
                  key={doc.name}
                  onClick={() => {
                    props.setSelectedDocType(doc);
                    setOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {doc.name}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default Select;
