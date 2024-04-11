
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

    let session1;

    async function test() {

        try {
            const response = await sessionKit.login()
            session1 = response.session;
        } catch(err) { 
            console.log("error", err);
        }
        if (session1) {
            localStorage.setItem("wharf_user_name", String(session1.permissionLevel.actor));
            localStorage.setItem("user_name", String(session1.permissionLevel.actor));
            window.location.reload(false);
        }
    }

    return(
        <div>
            <h2>
                Login with Anchor wallet
            </h2>    
            <Button type="button" label={"Login"} onClick={test} ></Button>
            <h4>
                <a href="https://www.greymass.com/anchor" target="_blank">
                    Download Anchor Wallet
                </a>
            </h4>
        </div>
    )
}

export default TestWharf;

