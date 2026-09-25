import { useEffect, useState } from "react";
import type { Garment } from "./types/Garment";
import type { DraftGarment } from "./types/DraftGarment";
import {
  createGarment,
  getGarments,
  claimGarment,
  unclaimGarment,
  verifyAdminPassword,
} from "./api.ts";

function App() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [claimantName, setClaimantName] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [promptCleared, setPromptCleared] = useState<boolean>(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("isAdmin") == "true";
  });
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [draftGarments, setDraftGarments] = useState<DraftGarment[]>([]);
  const [currName, setCurrName] = useState<string>("");
  const [currSize, setCurrSize] = useState<string>("");
  const [currDescription, setCurrDescription] = useState<string>("");
  const [currFiles, setCurrFiles] = useState<File[]>([]);

  async function handleVerifyPassword() {
    try {
      await verifyAdminPassword(adminPassword);
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      setErrorMessage("");
    } catch (error) {
      console.log("verifyAdminPassword encountered an error", error);
      setErrorMessage("Failed to verify admin password.");
    }
  }

  function clearFields() {
    setCurrName("");
    setCurrSize("");
    setCurrDescription("");
    setCurrFiles([]);
  }

  function handleSetName() {
    if (nameInput.trim() === "") {
      return;
    }
    setClaimToken(crypto.randomUUID());
    setClaimantName(nameInput);
    setPromptCleared(true);
  }

  function addToDrafts() {
    // Reject drafts with no name, size, or files
    if (currName.trim() === "") {
      return;
    }
    if (currFiles.length == 0) {
      return;
    }

    const newGarment: DraftGarment = {
      name: currName,
      size: currSize || null,
      description: currDescription || null,
      files: currFiles,
    };

    setDraftGarments([...draftGarments, newGarment]);

    clearFields();
  }

  function handleRemoveDrafts(index: number) {
    setDraftGarments(draftGarments.filter((_, i) => i !== index));
  }

  function handleEditDraft(index: number) {
    const draft = draftGarments[index];
    setCurrName(draft.name);
    setCurrSize(draft.size || "");
    setCurrDescription(draft.description || "");
    setCurrFiles(draft.files);
    setDraftGarments(draftGarments.filter((_, i) => i !== index));
  }

  async function submitAllDrafts() {
    const failed: DraftGarment[] = [];
    for (const draftGarment of draftGarments) {
      try {
        await createGarment(
          draftGarment.name,
          draftGarment.size,
          draftGarment.description,
          draftGarment.files,
          adminPassword,
        );
      } catch (error) {
        failed.push(draftGarment);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Garment creation encountered an error.");
        }
      }
    }
    setDraftGarments(failed);
    clearFields();

    loadGarments();
  }

  async function handleClaim(garmentId: number) {
    try {
      await claimGarment(garmentId, claimantName, claimToken);
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
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("handleClaim encountered an error");
      }
    }
  }

  async function handleUnclaim(garmentId: number) {
    try {
      await unclaimGarment(garmentId, claimantName, claimToken);
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

  async function loadGarments() {
    try {
      const data = await getGarments();
      setGarments(data);
    } catch (error) {
      console.warn("useEffect failed to run getGarments", error);
    }
  }

  useEffect(() => {
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
              {garment.photo_urls.map((photo_url, index) => (
                <img key={index} src={photo_url} />
              ))}
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
          {isAdmin && (
            <div>
              <div>
                {draftGarments.map((draftGarment, index) => (
                  <div key={index}>
                    <p>{draftGarment.name}</p>
                    {draftGarment.size && <p>{draftGarment.size}</p>}
                    {draftGarment.description && (
                      <p>{draftGarment.description}</p>
                    )}
                    <p>{draftGarment.files.length}</p>
                    <button onClick={() => handleEditDraft(index)}>Edit</button>

                    <button onClick={() => handleRemoveDrafts(index)}>
                      Eviscerate
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <input
                  value={currName}
                  onChange={(e) => setCurrName(e.target.value)}
                />
                <input
                  value={currSize}
                  onChange={(e) => setCurrSize(e.target.value)}
                />
                <input
                  value={currDescription}
                  onChange={(e) => setCurrDescription(e.target.value)}
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files)
                      setCurrFiles(Array.from(e.target.files));
                  }}
                />
                <button onClick={addToDrafts}>Submit</button>
                {draftGarments.length > 0 && (
                  <button onClick={submitAllDrafts}>Upload all drafts</button>
                )}
              </div>
            </div>
          )}
          <div>
            <input
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <button onClick={handleVerifyPassword}>Submit</button>
          </div>
          {errorMessage && (
            <div>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
