import { FormEvent, useState } from "react";
import fxhashService, { Collection, Token } from "../service/fxhash-service";
import AlertAsync from "react-native-alert-async";
import pinataService from "../service/pinata-service";

enum PIN_STATUS {
  WAITING,
  PINNING,
  FINISHED,
}

export default function App() {
  const [collectionId, setCollectionId] = useState<string>("");
  const [pinataApiKey, setPinataApiKey] = useState<string>("");
  const [pinataApiSecretKey, setPinataApiSecretKey] = useState<string>("");
  const [collection, setCollection] = useState<Collection>();
  const [pinMessage, setPinMessage] = useState<string>();
  const [pinError, setPinError] = useState<string>();
  const [pinningStatus, setPinningStatus] = useState<PIN_STATUS>(
    PIN_STATUS.WAITING
  );

  const reset = () => {
    setPinningStatus(PIN_STATUS.WAITING);
    setPinMessage(undefined);
    setCollection(undefined);
    setPinError(undefined);
  };

  const removeAllPin = async () => {
    reset();

    let start = window.confirm(
      "You are about to UNPIN EVERY assets from your account. Do you want to continue ?"
    );

    if (start) {
      setPinningStatus(PIN_STATUS.PINNING);
      pinataService.removeAllPin(pinataApiKey, pinataApiSecretKey, (pin) => {
        setPinMessage(`Unpinned '${pin.metadata.name}'.`);
      });
      setPinningStatus(PIN_STATUS.FINISHED);
    } else {
      reset();
    }
  };

  const pinCollection = async (e: FormEvent) => {
    e.preventDefault();

    reset();

    setPinMessage("Loading ...");
    let collection;

    collection = await fxhashService.getCollection(parseInt(collectionId));
    if (!collection) {
      debugger;
      reset();
      setPinError(`No collection found for the id ${collectionId}`);
      return;
    }

    const startPin = window.confirm(
      `You are about to pin the entire ${collection.name} collection that actually has ${collection.objktsCount} tokens on a supply of ${collection.supply}. Do you want to continue ?`
    );

    if (startPin) {
      setPinningStatus(PIN_STATUS.PINNING);
      setCollection(collection);
      try {
        await pinataService.pinCollection(
          pinataApiKey,
          pinataApiSecretKey,
          parseInt(collectionId),
          (token) => {
            setPinMessage(`Pinned token '${token.metadata.name}'...`);
          }
        );
      } catch (error: any) {
        reset();
        setPinError(error.details);
        return;
      }

      setPinningStatus(PIN_STATUS.FINISHED);
      setPinMessage("Done");
    } else {
      reset();
    }
  };

  return (
    <div>
      <h1>Pin FXHash collection</h1>
      <p className="explanation">
        This is a tool that allow to pin an entire FXHash collection. <br />
        You can retrieve the collection id on the generative token page on{" "}
        <a href="http://fxhash.xyz">http://fxhash.xyz</a>.<br />
        You can generate an API key from your Pinata account on{" "}
        <a href="https://app.pinata.cloud/">https://app.pinata.cloud/</a>
      </p>
      <form onSubmit={pinCollection}>
        <label className="labeled-input">
          Collection Id:{" "}
          <input
            type="text"
            name="collection-id"
            onChange={(e) => setCollectionId(e.target.value)}
          />
        </label>
        <br />
        <label className="labeled-input">
          Pinata API Key:{" "}
          <input
            type="text"
            name="pinata-api-key"
            onChange={(e) => setPinataApiKey(e.target.value)}
          />
        </label>
        <br />
        <label className="labeled-input">
          Pinata API Secret Key:{" "}
          <input
            type="text"
            name="pinata-api-secret-key"
            onChange={(e) => setPinataApiSecretKey(e.target.value)}
          />
        </label>
        <br />
        <button
          disabled={
            pinningStatus != PIN_STATUS.WAITING ||
            !collectionId ||
            !pinataApiKey ||
            !pinataApiSecretKey
          }
        >
          Pin collection
        </button>
        <button
          type="button"
          onClick={removeAllPin}
          disabled={
            pinningStatus != PIN_STATUS.WAITING ||
            !pinataApiKey ||
            !pinataApiSecretKey
          }
        >
          Delete All Tokens
        </button>
      </form>
      {pinningStatus != PIN_STATUS.WAITING ? (
        <div className="status">
          {collection ? (
            <h3>
              Start pinning {collection.name}, {collection.objktsCount} objkt
              found.
            </h3>
          ) : null}
          <p>{pinMessage}</p>
        </div>
      ) : null}
      <p>{pinError ? pinError : null}</p>
    </div>
  );
}
