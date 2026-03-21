import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Image } from "@shopify/polaris";
import { login } from "../../shopify.server";

import styles from "./styles.module.css";
import logo from "../../assets/intastellar-consents-logo.svg";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <Image source={logo} alt="Intastellar Consents" width={100} height={100} />
        <h1 className={styles.heading}>
          Intastellar Consents
        </h1>
        <p className={styles.text}>
          Manage your cookie consents and preferences in one place.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Google Consent Mode v2</strong>. Google's new consent mode that allows you to manage your cookie consents and preferences in one place. Supporting advanced mode.
          </li>
          <li>
            <strong>GDPR compliance</strong>. We help you comply with GDPR and other privacy laws.
          </li>
          <li>
            <strong>CCPA compliance</strong>. We help you comply with CCPA and other privacy laws.
          </li>
          <li>
            <strong>Cookie consent banner</strong>. We help you display a cookie consent banner on your store.
          </li>
        </ul>
      </div>
    </div>
  );
}
