import { retrieveCollection } from "./src/fxhash";
import { pinCollection, removeAllPin } from "./src/pinata";

require("dotenv").config();

// (async () => {
//   const collection = await retrieveCollection(2158);
//   console.log(collection[0]);
// })();

// removeAllPin();

pinCollection(677);
