import { Metadata } from "next";

import { metadata as baseMetadata } from "@/base/meta/Metadata";

import { db } from "@/utils/firebase";

import { collection, getDocs, query, where } from "firebase/firestore";

export interface Article {
  title: string;
  description: string;
  imageUrl: string[];
  slug: string;
  publishedDate?: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const articleRef = collection(
      db,
      process.env.NEXT_PUBLIC_COLLECTIONS_ARTICLES as string
    );
    const q = query(articleRef, where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const articleData = querySnapshot.docs[0].data() as Article;
    return articleData;
  } catch (error) {
    console.error("Error fetching Article:", error);
    return null;
  }
}

type MetadataProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = params;
  const url = `articles/${slug}`;

  // Get the article data
  const article = await getArticle(slug);

  // If article is not found, return 404 metadata
  if (!article) {
    return {
      title: "Article Not Found | Space Digitalia",
      description: "Maaf, artikel yang Anda cari tidak ditemukan.",
      openGraph: {
        ...baseMetadata.openGraph,
        title: "Article Not Found | Space Digitalia",
        description: "Maaf, artikel yang Anda cari tidak ditemukan.",
        url: url,
        siteName: "Space Digitalia",
        locale: "id_ID",
        images: [
          {
            url: "/favicon.ico",
            width: 1920,
            height: 1080,
            alt: "Article Not Found",
          },
        ],
      },
      twitter: {
        ...baseMetadata.twitter,
        title: "Article Not Found | Space Digitalia",
        description: "Maaf, artikel yang Anda cari tidak ditemukan.",
        images: ["/favicon.ico"],
      },
    };
  }

  // Use article data if available, otherwise fallback to generic metadata
  const title = article?.title || `${slug} | Space Digitalia`;
  const description =
    article?.description || `Baca artikel ${slug} di Space Digitalia`;
  const imageUrl = article?.imageUrl?.[0] || "/favicon.ico";

  // Add script to push data to dataLayer
  const script = {
    type: "application/ld+json",
    json: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: description,
      image: imageUrl,
      url: url,
      datePublished: article?.publishedDate || new Date().toISOString(),
      author: {
        "@type": "Person",
        name: "Rizki Ramadhan",
      },
    },
  };

  return {
    title,
    description,
    keywords: "Articles, SPACE DIGITALIA",
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL as string),
    alternates: {
      canonical: url,
    },

    openGraph: {
      ...baseMetadata.openGraph,
      type: "article",
      title,
      description,
      url: url,
      siteName: "Space Digitalia",
      locale: "id_ID",
      images: [
        {
          url: imageUrl,
          width: 1920,
          height: 1080,
          alt: title,
        },
      ],
    },

    twitter: {
      ...baseMetadata.twitter,
      title,
      description,
      creator: "@rizki_ramadhan",
      site: "@rizki_ramadhan",
      images: [imageUrl],
    },
    other: {
      "google-tag-manager": process.env
        .NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID as string,
      "google-site-verification": process.env
        .NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_ID as string,
      "json-ld": JSON.stringify(script.json),
    },
  };
}
