
import React, {useEffect, useState} from "react";
import { SessionKit } from "@wharfkit/session"
import { WebRenderer } from "@wharfkit/web-renderer"
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor"
import { ContractKit } from "@wharfkit/contract"
import {APIClient} from '@wharfkit/antelope'
import {Button} from "primereact/button";
import configuration from './configuration.json';

const TestWharf = () => {

    const webRenderer = new WebRenderer()
    
    const sessionKit = new SessionKit({
        appName: "passer",
        chains: [
            {
            id: configuration.passer.BCid, 
            url: localStorage.getItem("bcEndpoint"),
            },
        ],
        ui: webRenderer,
        walletPlugins: [new WalletPluginAnchor()],
    });

    const contractKit = new ContractKit({        
        client: new APIClient({url: localStorage.getItem("bcEndpoint")}),        
    });
      
    useEffect(() => {
    }, []);

    async function handleLogin() {
        try {
            await test();
        } catch (err) {
            console.error('An error occurred during login:', err);
            // Handle the error here, e.g. by showing an error message to the user
        }
    }

    async function test() {
        try {
            const response = await sessionKit.login();
            if (!response) {
                console.log("Login was canceled or an error occurred");
                throw new Error("Login was canceled or an error occurred");
            }
            const session1 = response.session;
            console.log("session****************", String(session1.permissionLevel.actor));
            localStorage.setItem("wharf_user_name", String(session1.permissionLevel.actor));
            localStorage.setItem("user_name", String(session1.permissionLevel.actor));
                // window.location.reload(false);
        } catch (err) {
            console.error('An error occurred during login:', err);
            // Handle the error here, e.g. by showing an error message to the user
            throw new Error("Login was canceled or an error occurred");
        }
    }

    return(
        <div>
            <h2>
                Login with Anchor wallet
            </h2>    
            <Button type="button" label={"Login"} onClick={handleLogin} ></Button>
            <h4>
                <a href="https://www.greymass.com/anchor" target="_blank">
                    Download Anchor Wallet
                </a>
            </h4>
        </div>
    )
}

export default TestWharf;

