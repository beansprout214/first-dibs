import { useEffect, useState } from "react";
import type { Garment } from "./types/Garment";
import { getGarments, claimGarment, unclaimGarment } from "./api.ts";

function App() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [claimantName, setClaimantName] = useState<string>("");

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
      <h1>First Dibs</h1>
      <p>Garment list will go here.</p>
      {garments.map((garment) => (
        <div key={garment.id}>
          <p>{garment.name}</p>
          <p>{garment.size}</p>
          <p>{garment.description}</p>
          {garment.photo_url && <img src={garment.photo_url} />}
        </div>
      ))}
    </div>
  );
}

export default App;
