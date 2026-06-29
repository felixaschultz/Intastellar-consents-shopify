import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  TextField,
  Select,
  InlineStack,
  Banner,
  Image,
} from "@shopify/polaris";
import { LegalDocumentLayout } from "../components/LegalDocumentLayout";
import { SHOPIFY_APP_IDENTITY } from "../lib/shopify-app-seo";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return true;
}

export const meta: MetaFunction = () => [
  {
    title: "Shopify Customer Privacy API Sync — Intastellar Consents",
  },
  {
    name: "description",
    content: "Intastellar Consents syncs consent decisions with Shopify's Customer Privacy API using one shared consent ID — so your store, analytics, and ad tools always agree.",
  },
  { name: "robots", content: "index, follow" },
  { tagName: "link", rel: "canonical", href: "/shopify-customer-privacy-api" },
];

export const links = () => {
  /* 
  Use these links to replace the favicon:
  <link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="apple-touch-icon" sizes="57x57" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-57x57.png">
      <link rel="apple-touch-icon" sizes="60x60" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-60x60.png">
      <link rel="apple-touch-icon" sizes="72x72" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-72x72.png">
      <link rel="apple-touch-icon" sizes="76x76" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-76x76.png">
      <link rel="apple-touch-icon" sizes="114x114" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-114x114.png">
      <link rel="apple-touch-icon" sizes="120x120" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-120x120.png">
      <link rel="apple-touch-icon" sizes="144x144" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-144x144.png">
      <link rel="apple-touch-icon" sizes="152x152" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-152x152.png">
      <link rel="apple-touch-icon" sizes="180x180" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-180x180.png">
      <link rel="icon" type="image/png" sizes="192x192" href="https://www.intastellarsolutions.com/assets/icons/fav/android-icon-192x192.png">
      <link rel="icon" type="image/png" sizes="32x32" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="96x96" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-96x96.png">
      <link rel="icon" type="image/png" sizes="16x16" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-16x16.png">
  */
  return [
    { rel: "apple-touch-icon", sizes: "57x57", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-57x57.png" },
    { rel: "apple-touch-icon", sizes: "60x60", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-60x60.png" },
    { rel: "apple-touch-icon", sizes: "72x72", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-72x72.png" },
    { rel: "apple-touch-icon", sizes: "76x76", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-76x76.png" },
    { rel: "apple-touch-icon", sizes: "114x114", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-114x114.png" },
    { rel: "apple-touch-icon", sizes: "120x120", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-120x120.png" },
    { rel: "apple-touch-icon", sizes: "144x144", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-144x144.png" },
    { rel: "apple-touch-icon", sizes: "152x152", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-152x152.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-180x180.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", href: "https://www.intastellarsolutions.com/assets/icons/fav/android-icon-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-96x96.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-16x16.png" },
  ]
};

/* Info page for Shopify Customer Privacy API */
export default function ShopifyCustomerPrivacyApi() {
  return (
    <LegalDocumentLayout title="Your Shopify consent data and your analytics don't agree. Here's why — and how to fix it." supplementalNotice={false} relatedLinks={[
      {
        href: "https://help.shopify.com/en/manual/privacy/shopify-customer-privacy-api",
        label: "Shopify Customer Privacy API Documentation",
        external: true,
      },
    ]}>
      <section>
        <p></p>
      </section>
      <section>
        <h2>What is Shopify's Customer Privacy API?</h2>
        <p>Shopify's Customer Privacy API is a tool that allows merchants to manage customer privacy data. It is a way for merchants to store and manage customer privacy data in a way that is compliant with GDPR and other privacy laws.</p>
      </section>
      <section>
        <h2>How Intastellar Consents syncs with it?</h2>
        <p>Intastellar Consents syncs with Shopify's Customer Privacy API by using the same consent ID for both Shopify and Intastellar Consents. This allows merchants to see the same consent data in both Shopify and Intastellar Consents.</p>
      </section>
      <section>
        <h2>Why is this important?</h2>
        <p></p>
      </section>
      <section>
        <h2>What Shopify's built-in consent tracking doesn't give you</h2>
        <p></p>
      </section>
      <section>
        <h2>Compatible with the tools you already use</h2>
      </section>
    </LegalDocumentLayout>
  );
}