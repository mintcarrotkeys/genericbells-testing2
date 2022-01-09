const redirect = encodeURIComponent('https://genericbells-testing2.pages.dev');
const appId = "genericbellstestingonly_1641706298";

document.getElementById('version').textContent = "v0.2.9";

async function requestToken() {
    localStorage.setItem('access_age', Date.now().toString());
    localStorage.removeItem('handle_access');
    const codeVerifier = localStorage.getItem('handle_verifier');
    const state = localStorage.getItem('handle_state');
    if (codeVerifier == null) {
        return false;
    }
    const params = new URLSearchParams(location.href.toString().split("?")[1]);
    history.replaceState({}, "", "/");
    if (params.has('code') === false) {
        return false;
    }
    const code = params.get('code');
    const returnedState = params.get('state');
    if (returnedState !== state) {
        return false;
    }
    const requestBody = (
        "grant_type=authorization_code" +
        "&redirect_uri=" + redirect +
        "&client_id=" + appId +
        "&code=" + code +
        "&code_verifier=" + codeVerifier
    );
    const requestURL = (
        "https://student.sbhs.net.au/api/token"
    );

    let response = await fetch(requestURL, {
        method: "POST",
        headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
        body: requestBody});
    if (!response.ok) {
        console.log("1st response error");
        response = await fetch(requestURL, {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
            body: requestBody});
        if (!response.ok) {
            console.log('2nd response error');
            return false;
        }
    }
    const tokens = await response.json();
    console.log(tokens);
    localStorage.setItem('handle_access', tokens['access_token']);
    localStorage.setItem('access_age', Date.now().toString());

    return true;
}
async function requestCode() {
    //generate code verifier 43-128 characters long
    function randomString(length) {
        let randomNumbers = new Uint32Array(length);
        let verifier = "";
        const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        crypto.getRandomValues(randomNumbers);
        for (const i of randomNumbers) {
            verifier += allowedChars.charAt((i % 66));
        }
        return verifier;
    }
    async function digestMessage(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return hash;
    }
    function base64url(input) {
        let hashString = "";
        for (const i of input) {
            hashString += String.fromCharCode(i);
        }
        return btoa(hashString).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
    }
    const codeVerifier = randomString(128);
    const hash = await digestMessage(codeVerifier);
    const viewHash = new Uint8Array(hash);
    const codeChallenge = base64url(viewHash);
    const state = randomString(32);
    localStorage.setItem('handle_verifier', codeVerifier);
    localStorage.setItem('handle_state', state);

    const requestURL = (
        "https://student.sbhs.net.au/api/authorize?" +
        "client_id=" + appId + "&" +
        "response_type=code&" +
        "state=" + state + "&" +
        "code_challenge=" + codeChallenge + "&" +
        "code_challenge_method=S256&" +
        "scope=all-ro&" +
        "redirect_uri=" + redirect
    );

    location.assign(requestURL);

}
document.getElementById("test").onclick = requestCode;
async function stateManager() {
    const params = new URLSearchParams(location.href.toString().split("?")[1]);
    const tokenAge = localStorage.getItem('access_age');
    const token = localStorage.getItem('handle_access');
    console.log("token age: " + Number(tokenAge));
    console.log("current time: " + Date.now());
    let response;
    if (params.has('code')) {
        response = await requestToken();
        if (response === false) {
            return "askToLogin";
        }
        else {
            return "success";
        }
    }
    else if (tokenAge !== "" && (Date.now() <= (Number(tokenAge) + 3500000))) {
        //check for token - if no token then show login message
        if (token !== "") {
            return "success";
        }
        else {
            return "askToLogin";
        }
        //if token exist but too old then automatically redirect to login
    }
    else {
        await requestCode();
        return "redirect";
    }
}
// function to request data
async function fetchData() {
    const baseUrl = "https://student.sbhs.net.au/api/";
    const resources = [];
    let routineData;
    const token = "Bearer " + localStorage.getItem('handle_access');
    console.log(token);

    await fetch(baseUrl + "details/userinfo.json",
        { headers: new Headers({'Authorization': token})})
        .then(res => res.json()).then(data => routineData = data).then(() => console.log(routineData));

}
// if token doesn't work, delete token and start again.

async function organiser() {
    const result = await stateManager();
    if (result === "askToLogin") {
        document.getElementById("test").textContent = "Click to Login";
    }
    else if (result === "success") {
       fetchData().then(data => console.log(data));
    }
    else {
        console.log("result: " + result);
    }
    console.log("result: " + result);
    console.log(localStorage.getItem('handle_access'))
}

const result = organiser();