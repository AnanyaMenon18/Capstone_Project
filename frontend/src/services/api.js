
import axios from "axios";

const API = axios.create({
    baseURL: "https://bonds-contribute-definitely-flow.trycloudflare.com",
    headers: {
        "Content-Type": "application/json"
    }
});

export default API;
