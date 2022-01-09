const projectSource = "genericbells-testing2.pages.dev";

addEventListener("fetch", (event) => {
    event.respondWith(
        sortRequest(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
});

async function sortRequest(request) {
    console.log("Hi");
    if (request.method === "OPTIONS") {
        return await respondToCors(request);
    }
    else if (request.method === "GET") {
        return await handleRequest(request);
    }
}

async function respondToCors(request) {
    const resHeaders = {
        "Access-Control-Allow-Origin": projectSource,
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow_Headers": "content-type authorization"
    }

    return new Response(null, {headers: resHeaders, status: 200, statusText: 'OK'});
}


async function handleRequest(request) {
    const callables = {
        tt: 'timetable/timetable.json',
        idn: 'details/userinfo.json',
        wk: 'timetable/bells.json',
        dtt: 'timetable/daytimetable.json'
    };
    const point = "https://student.sbhs.net.au/api/";

    const token = request.headers.get('authorization');
    const params = new URLSearchParams(request.url.split("?")[1]);
    if (!params.has('ask')) {
        return new Response(null, {status: 404, statusText: "Not Found"});
    }
    const ask = params.get('ask');
    if(!callables.hasOwnProperty(ask)) {
        return new Response(null, {status: 404, statusText: "Not Found"});
    }
    if (token !== null) {
        return fetch(point + callables[ask], {headers: {Authorization: token}});
    }
    else if (ask === 'wk') {
        return fetch(point + callables[ask]);
    }
    else {
        return new Response(null, {status: 404, statusText: "Not Found"});
    }



}