import { FormEvent, useState } from "react";
import fxhashService, { Collection, Token } from "../service/fxhash-service";
import pinataService from "../service/pinata-service";

enum PIN_STATUS {
  WAITING,
  PINNING,
}

export default function App() {
  const [collectionId, setCollectionId] = useState<string>("");
  const [pinataApiKey, setPinataApiKey] = useState<string>("");
  const [pinataApiSecretKey, setPinataApiSecretKey] = useState<string>("");
  const [collection, setCollection] = useState<Collection>();
  const [pinMessage, setPinMessage] = useState<string>();
  const [pinError, setPinError] = useState<string>();
  const [pinThumbnail, setPinThumbnail] = useState<boolean>(false);
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
      "You are about to UNPIN EVERY assets from your Pinagta account. Do you want to continue ?"
    );

    if (start) {
      setPinningStatus(PIN_STATUS.PINNING);
      pinataService.removeAllPin(pinataApiKey, pinataApiSecretKey, (pin) => {
        setPinMessage(`Unpinned '${pin.metadata.name}'.`);
      });
      setPinningStatus(PIN_STATUS.WAITING);
      setPinMessage("Done");
    } else {
      reset();
    }
  };

  const pinCollection = async (e: FormEvent) => {
    e.preventDefault();

    reset();

    setPinMessage("Loading ...");
    setPinningStatus(PIN_STATUS.PINNING);
    let collection;
    const currentPinThumbnail = pinThumbnail;

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
      setCollection(collection);
      try {
        await pinataService.pinCollection(
          pinataApiKey,
          pinataApiSecretKey,
          parseInt(collectionId),
          {
            pinThumbnail: currentPinThumbnail,
            onTokenPinned: (token) => {
              setPinMessage(`Pinning token '${token.metadata.name}'...`);
            },
          }
        );
      } catch (error: any) {
        reset();
        setPinError(error.details);
        return;
      }

      setPinningStatus(PIN_STATUS.WAITING);
      setPinMessage("Done");
    } else {
      reset();
    }
  };

  const logoUrl = new URL("/assets/logo.webm", import.meta.url);

  return (
    <div className="container">
      <section id="content">
        <h1>Pin FXHash collection</h1>
        <div className="explanation">
          <p>
            This tool allows you to pin an{" "}
            <a href="http://fxhash.xyz">FXHash</a> collection on{" "}
            <a href="https://app.pinata.cloud/keys">Pinata</a>. For this you
            must <a href="https://app.pinata.cloud/keys">generate an API key</a>{" "}
            from your account. The collection id can be found on the generative
            token page.
          </p>
          <p>
            <i>
              Only artworks not pinned will be added. So you can reuse the tool
              as you wish and add the thumbnails afterwards.
            </i>
          </p>
        </div>
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
          <label className="labeled-checkbox">
            Pin thumbnail:
            <input
              type="checkbox"
              name="pin-thumbnail"
              checked={pinThumbnail}
              onChange={(e) => setPinThumbnail(!pinThumbnail)}
            />
          </label>
          <br />
          <div className="button-container">
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
              style={{ visibility: "hidden" }}
              type="button"
              onClick={removeAllPin}
              disabled={
                pinningStatus != PIN_STATUS.WAITING ||
                !pinataApiKey ||
                !pinataApiSecretKey
              }
            >
              Reset Pinata account
            </button>
          </div>
        </form>
        <br />
        <br />
        <div className="status">
          {collection ? (
            <h3>
              Start pinning {collection.name}, {collection.objktsCount} objkt
              found.
            </h3>
          ) : null}
          <p>{pinMessage}</p>
        </div>
        <p>{pinError ? pinError : null}</p>
      </section>
      <section id="footer">
        <a href="http://compute.art/">
          <video
            src={`${logoUrl.toString()}`}
            autoPlay
            loop
            muted
            playsInline
          />
        </a>
        <ul>
          <li>
            <a href="https://twitter.com/computenft" target="_blank">
              Twitter
            </a>
          </li>
          <li>
            <a href="mailto:hello@compute.art">hello@compute.art</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
