"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "http://localhost:3000/api/data/firestore/users"
      ); // or 'http://localhost:3000/api/data/firestore/test-collection' directly
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, []);
  return (
    <div>
      <h1>Data from Firestore</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
