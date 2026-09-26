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
import "./App.css";

function App() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [claimantName, setClaimantName] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [promptCleared, setPromptCleared] = useState<boolean>(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("isAdmin") == "true";
  });
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [draftGarments, setDraftGarments] = useState<DraftGarment[]>([]);
  const [currName, setCurrName] = useState<string>("");
  const [currSize, setCurrSize] = useState<string>("");
  const [currDescription, setCurrDescription] = useState<string>("");
  const [currFiles, setCurrFiles] = useState<File[]>([]);
  const [isLightboxClosing, setIsLightboxClosing] = useState<boolean>(false);

  const [lightboxGarmentId, setLightboxGarmentId] = useState<number | null>(
    null,
  );

  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<number, number>
  >({});

  async function handleVerifyPassword() {
    try {
      await verifyAdminPassword(adminPassword);
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      setErrorMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to verify admin password.");
      }
    }
  }

  function clearFields() {
    setCurrName("");
    setCurrSize("");
    setCurrDescription("");
    setCurrFiles([]);
  }

  function closeLightbox() {
    setIsLightboxClosing(true);
    setTimeout(() => {
      setLightboxGarmentId(null);
      setIsLightboxClosing(false);
    }, 200); // matches the CSS animation duration below
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
    if (currName.trim() === "") {
      setErrorMessage("Garment name is required.");
      return;
    }
    if (currFiles.length == 0) {
      setErrorMessage("At least one photo is required.");
      return;
    }

    const newGarment: DraftGarment = {
      name: currName,
      size: currSize || null,
      description: currDescription || null,
      files: currFiles,
    };

    setDraftGarments([...draftGarments, newGarment]);
    setErrorMessage("");
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

    if (failed.length === 0) {
      setSuccessMessage("All garments uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
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
      setErrorMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to claim garment.");
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
      setErrorMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to unclaim garment.");
      }
    }
  }

  async function loadGarments() {
    try {
      const data = await getGarments();
      setGarments(data);
    } catch (error) {
      console.warn("Failed to load garments", error);
    }
  }

  useEffect(() => {
    loadGarments();

    // POLLING FOR REAL-TIME UPDATES
    // This is a temporary solution. For your next project, implement WebSockets (Socket.io)
    // instead of polling. WebSockets allow instant two-way communication between client and
    // server, so when one user claims a garment, all other users see it immediately without
    // needing to request updates every 10 seconds. This approach is much more efficient and
    // provides a better user experience for multi-user applications.
    //
    // To implement Socket.io in your next project:
    // 1. Backend: npm install socket.io, create a Socket.io server, emit events on claim/unclaim
    // 2. Frontend: npm install socket.io-client, connect on mount, listen for events
    // 3. When connected users get broadcasted events, update state without refetching
    const pollInterval = setInterval(() => {
      loadGarments();
    }, 10000); // Refetch garment list every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxGarmentId(null);
      }
    }
    if (lightboxGarmentId !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxGarmentId]);

  function handlePrevImage(garmentId: number, totalImages: number) {
    const current = currentImageIndex[garmentId] || 0;
    setCurrentImageIndex({
      ...currentImageIndex,
      [garmentId]: current === 0 ? totalImages - 1 : current - 1,
    });
  }

  function handleNextImage(garmentId: number, totalImages: number) {
    const current = currentImageIndex[garmentId] || 0;
    setCurrentImageIndex({
      ...currentImageIndex,
      [garmentId]: (current + 1) % totalImages,
    });
  }

  const filteredGarments = garments.filter((garment) =>
    garment.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const lightboxGarment =
    garments.find((g) => g.id === lightboxGarmentId) || null;

  return (
    <div>
      {!promptCleared ? (
        <div className="name-prompt-screen">
          <div className="name-prompt">
            <h2>Welcome to First Dibs</h2>
            <p className="name-prompt-description">
              Browse clothes I'm giving away and claim anything you'd like
              before it goes to donation. Enter your name so others can see what
              you've picked and avoid double-claiming the same item.
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            />
            <button onClick={handleSetName}>Get Started</button>
          </div>
        </div>
      ) : (
        <div className="main-container">
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <div className="header">
            <h1>First Dibs</h1>
            {/* <div className="header-controls">
              <input
                type="text"
                placeholder={claimantName}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameInput.trim()) {
                    setClaimToken(crypto.randomUUID());
                    setClaimantName(nameInput);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (nameInput.trim()) {
                    setClaimToken(crypto.randomUUID());
                    setClaimantName(nameInput);
                  }
                }}
              >
                Update Name
              </button>
            </div> */}
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="Search garments by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="garments-section">
            {filteredGarments.length === 0 ? (
              <div className="empty-state">
                <h3>No garments found</h3>
                <p>
                  {searchQuery
                    ? `Nothing matches "${searchQuery}". Try a different search.`
                    : "No garments have been added yet — check back soon."}
                </p>
              </div>
            ) : (
              <div className="garments-grid">
                {filteredGarments.map((garment) => {
                  const imageIndex = currentImageIndex[garment.id] || 0;
                  const currentImage = garment.photo_urls[imageIndex];

                  return (
                    <div key={garment.id} className="garment-card">
                      <div className="garment-images">
                        <div className="garment-image-container">
                          {currentImage && (
                            <img
                              src={currentImage}
                              alt={garment.name}
                              className="garment-image"
                              onClick={() => setLightboxGarmentId(garment.id)}
                            />
                          )}
                          {garment.photo_urls.length > 1 && (
                            <>
                              <div className="image-nav">
                                <button
                                  onClick={() =>
                                    handlePrevImage(
                                      garment.id,
                                      garment.photo_urls.length,
                                    )
                                  }
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() =>
                                    handleNextImage(
                                      garment.id,
                                      garment.photo_urls.length,
                                    )
                                  }
                                >
                                  →
                                </button>
                              </div>
                              <div className="image-counter">
                                {imageIndex + 1} / {garment.photo_urls.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="garment-info">
                        <h3>{garment.name}</h3>
                        <div className="garment-meta">
                          {garment.size && (
                            <div className="garment-size">{garment.size}</div>
                          )}
                          {garment.description && (
                            <div className="garment-description">
                              {garment.description}
                            </div>
                          )}
                        </div>

                        {garment.claimant_name ? (
                          <>
                            <div className="garment-claim-status claimed">
                              Claimed by {garment.claimant_name}
                              {garment.claimed_at && (
                                <div
                                  style={{ fontSize: "12px", marginTop: "4px" }}
                                >
                                  {new Date(
                                    garment.claimed_at,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {garment.claimant_name === claimantName && (
                              <button
                                className="unclaim-button"
                                onClick={() => handleUnclaim(garment.id)}
                              >
                                Unclaim
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="garment-claim-status unclaimed">
                              Available
                            </div>
                            <button
                              className="claim-button"
                              onClick={() => handleClaim(garment.id)}
                            >
                              Claim This
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {lightboxGarment && (
            <div
              className={`lightbox-overlay${isLightboxClosing ? " closing" : ""}`}
              onClick={closeLightbox}
            >
              <button
                className="lightbox-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxGarmentId(null);
                }}
              >
                ×
              </button>
              <div
                className="lightbox-content"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={
                    lightboxGarment.photo_urls[
                      currentImageIndex[lightboxGarment.id] || 0
                    ]
                  }
                  alt={lightboxGarment.name}
                  className="lightbox-image"
                />
                {lightboxGarment.photo_urls.length > 1 && (
                  <>
                    <div className="lightbox-nav">
                      <button
                        onClick={() =>
                          handlePrevImage(
                            lightboxGarment.id,
                            lightboxGarment.photo_urls.length,
                          )
                        }
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          handleNextImage(
                            lightboxGarment.id,
                            lightboxGarment.photo_urls.length,
                          )
                        }
                      >
                        →
                      </button>
                    </div>
                    <div className="lightbox-counter">
                      {(currentImageIndex[lightboxGarment.id] || 0) + 1} /{" "}
                      {lightboxGarment.photo_urls.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="admin-section">
              <h2>Add Garments</h2>

              {draftGarments.length > 0 && (
                <div className="drafts-container">
                  <h3>Drafts ({draftGarments.length})</h3>
                  <div className="draft-list">
                    {draftGarments.map((draft, index) => (
                      <div key={index} className="draft-item">
                        <div className="draft-info">
                          <div className="draft-name">{draft.name}</div>
                          <div className="draft-meta">
                            {draft.size && `Size: ${draft.size} • `}
                            {draft.files.length} photo
                            {draft.files.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="draft-actions">
                          <button onClick={() => handleEditDraft(index)}>
                            Edit
                          </button>
                          <button onClick={() => handleRemoveDrafts(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn-submit"
                    style={{ width: "100%" }}
                    onClick={submitAllDrafts}
                  >
                    Upload All ({draftGarments.length})
                  </button>
                </div>
              )}

              <div className="admin-form">
                <div className="form-group">
                  <label htmlFor="garment-name">Garment Name *</label>
                  <input
                    id="garment-name"
                    type="text"
                    placeholder="e.g., Blue Hoodie"
                    value={currName}
                    onChange={(e) => setCurrName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToDrafts()}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="garment-size">Size</label>
                  <input
                    id="garment-size"
                    type="text"
                    placeholder="e.g., M, Large, One Size"
                    value={currSize}
                    onChange={(e) => setCurrSize(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToDrafts()}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="garment-description">Description</label>
                  <input
                    id="garment-description"
                    type="text"
                    placeholder="e.g., Wool blend, minimal wear"
                    value={currDescription}
                    onChange={(e) => setCurrDescription(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToDrafts()}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="garment-photos">Photos * (Multiple OK)</label>
                  <input
                    id="garment-photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setCurrFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {currFiles.length > 0 && (
                    <div className="file-list">
                      {Array.from(currFiles).map((file, idx) => (
                        <div key={idx} className="file-list-item">
                          ✓ {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-buttons">
                  <button className="btn-add" onClick={addToDrafts}>
                    Add to Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="password-section">
            <h3>{isAdmin ? "Logged in as Admin" : "Admin Access"}</h3>
            <div className="password-form">
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
              />
              <button onClick={handleVerifyPassword}>Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
