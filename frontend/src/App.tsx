import { useEffect, useState } from "react";
import type { Garment } from "./types/Garment";
import { getGarments, claimGarment, unclaimGarment } from "./api.ts";

function App() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [claimantName, setClaimantName] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [promptCleared, setPromptCleared] = useState<boolean>(false);

  function handleSetName() {
    if (nameInput.trim() === "") {
      return;
    }
    setClaimantName(nameInput);
    setPromptCleared(true);
  }

  async function handleClaim(garmentId: number) {
    try {
      await claimGarment(garmentId, claimantName);
      setGarments(
        garments.map((garment) => {
          if (garment.id === garmentId) {
            return { ...garment, claimant_name: claimantName };
          }
          return garment;
        }),
      );
    } catch (error) {
      console.warn("handleClaim encountered an error", error);
    }
  }

  async function handleUnclaim(garmentId: number) {
    try {
      await unclaimGarment(garmentId, claimantName);
      setGarments(
        garments.map((garment) => {
          if (
            garment.id === garmentId &&
            garment.claimant_name == claimantName
          ) {
            return { ...garment, claimant_name: null };
          }
          return garment;
        }),
      );
    } catch (error) {
      console.warn("handleUnclaim encountered an error", error);
    }
  }

  useEffect(() => {
    async function loadGarments() {
      try {
        const data = await getGarments();
        setGarments(data);
      } catch (error) {
        console.warn("useEffect failed to run getGarments", error);
      }
    }
    loadGarments();
  }, []);

  return (
    <div>
      {!promptCleared ? (
        <div>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button onClick={handleSetName}>Submit Name</button>
        </div>
      ) : (
        <div>
          <h1>First Dibs</h1>
          <p>Garment list will go here.</p>
          <div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button onClick={handleSetName}>Change Name</button>
          </div>
          {garments.map((garment) => (
            <div key={garment.id}>
              <p>{garment.name}</p>
              <p>{garment.size}</p>
              <p>{garment.description}</p>
              {garment.photo_url && <img src={garment.photo_url} />}
              <div>
                {garment.claimant_name ? (
                  <span>
                    Claimed by {garment.claimant_name}{" "}
                    {garment.claimed_at ? (
                      <span> at {garment.claimed_at}</span>
                    ) : (
                      <span />
                    )}
                    {garment.claimant_name === claimantName ? (
                      <button onClick={() => handleUnclaim(garment.id)}>
                        Click to unclaim
                      </button>
                    ) : (
                      <span />
                    )}
                  </span>
                ) : (
                  <button onClick={() => handleClaim(garment.id)}>
                    Click to claim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
