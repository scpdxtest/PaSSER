import {APIClient} from '@wharfkit/antelope'
import { create } from "ipfs-http-client";
import configuration from './configuration.json';

export async function checkBCEndpoint() {
    const epoints = configuration.passer.BCEndPoints.map(item => item.url);
    const res = [];
    for (let i = 0; i < epoints.length; i++) {
        const ch = new APIClient({url: epoints[i]});
        try {
            const res = await ch.v1.chain.get_info();
            return epoints[i];
        } catch (err) {
            console.log("chain info error", err);
        }
    }
}

export async function checkIPFSEndpoint() {
    const ipfs_epoints = configuration.passer.IPFSEndPoints.map(item => ({host: item.host, port: item.port}));
    for (let i = 0; i < ipfs_epoints.length; i++) {
        const client = create({
            host: ipfs_epoints[i].host,
            port: ipfs_epoints[i].port,
            protocol: 'http'
        })
        try {
            const resp = client.isOnline();
            return ipfs_epoints[i];
        } catch (err) {
            console.log("ipfs info error", err);
        }
    }
}