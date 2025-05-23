import { collection, query, where, onSnapshot } from "firebase/firestore";

import { db } from "@/utils/firebase";

import { ProjectType } from "@/components/ui/project/types/project";

export function FetchProject(callback: (project: ProjectType[]) => void) {
  const q = query(
    collection(db, process.env.NEXT_PUBLIC_COLLECTIONS_PROJECT as string),
    where("createdAt", "!=", "")
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
      })) as ProjectType[]
    );
  });
}
