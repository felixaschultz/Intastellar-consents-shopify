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
        <p>Shopify's Customer Privacy API is the system Shopify uses to record what each visitor agreed to — analytics, marketing, preferences — and share that decision with your store's apps and pixels. It's what tells Google Analytics or Meta Pixel whether a visitor consented before those tools fire.</p>
        <p>The problem is that most consent apps sync loosely with it, which means your banner and Shopify's consent log can end up recording different things.</p>
        <p>Intastellar Consents solves this by sharing a single consent ID across both systems from the moment a visitor makes their choice. What your banner records and what Shopify records are always the same — and you can see acceptance rates, regional patterns, and trends that Shopify's log alone doesn't surface.</p>
      </section>
      <section>
        <h2>What is Shopify's Customer Privacy API?</h2>
        <p>It's Shopify's built-in framework for recording visitor consent decisions and sharing them across your store's ecosystem — themes, apps, and pixels. When a visitor accepts or declines your cookie banner, the API stores their choice and assigns them a consent ID. Shopify-compatible tools like Google Analytics and Meta Pixel read from that ID before deciding whether to fire.
        It handles the storage side of consent well. What it doesn't do is help you understand it.</p>
      </section>
      <section>
        <h2>What Shopify's consent log doesn't show you</h2>
        <ul>
            <li>What percentage of your visitors actually accept consent</li>
            <li>Whether EU visitors behave differently from US visitors</li>
            <li>Whether a banner change improved your acceptance rate over time</li>
            <li>How consent rates affect your ad tracking and conversion data</li>
        </ul>
        <p>The data exists in Shopify — it's just not built for insight. That's where most merchants end up guessing whether their consent setup is actually working.</p>
      </section>
      <section>
        <h2>How Intastellar Consents syncs with Shopify's Customer Privacy API</h2>
        <p>Most consent apps write to the Customer Privacy API as an afterthought — a loose sync after their own banner fires. That creates a gap between what your CMP recorded and what Shopify logged.
        Intastellar Consents uses a shared consent ID from the start. The moment a visitor makes their choice, both Shopify and Intastellar Consents record the same decision under the same ID — no reconciliation needed, no mismatches.</p>
        <p>From there, the Intastellar Consents dashboard gives you what Shopify's log can't: acceptance rates by region, behavior trends over time, and exportable reports when you need them for compliance or campaign planning.</p>
      </section>
      <section>
        <h2>Works with the tools already on your store</h2>
        <ul>
            <li>Google Consent Mode v2 (including Advanced)</li>
            <li>Microsoft UET Consent Mode</li>
            <li>Meta Pixel</li>
            <li>HubSpot Cookie API</li>
            <li>Shopify Customer Privacy API (native sync)</li>
        </ul>
      </section>
    </LegalDocumentLayout>
  );
}