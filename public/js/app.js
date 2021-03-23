// The Auth0 client, initialized in configureClient()
let auth0 = null;

//Retrieves the auth configuration from the server
const fetchAuthConfig = () => fetch("/auth_config");

//Initializes the Auth0 client
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience,
    //Setting the scope
    scope: 'openid profile email'
  });
};

//Starts the authentication flow
const login = async () => {
  try {
    console.log("Logging in");
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
  }); 
  } catch (err) {
    console.log("Log in failed", err);
  }
};

//Executes the logout flow
const logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

// Checks to see if the user is authenticated. 
// If so, `fn` is executed. 
// Otherwise, the user is prompted to log in
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login();
};

// Place the order using the API and the uth token
const newOrder = async () => {
  const user = await auth0.getUser();
  // Checks email is verified before accepting orders
  if(user.email_verified){
    try {
      const token = await auth0.getTokenSilently();
      const response = await fetch(`/orders/new-order?email=${user.email}`, {
        headers: {
          Authorization: `Bearer ${token}`
        } 
      });

      const responseData = await response.json();
      console.log(responseData.msg);
      if(responseData.msg == "success"){
        window.alert('Your Pizza is on the Way!!');
      }
    } catch (err) {
      console.log("Server Authorization Failed", err);
    } 
  } else {
    window.alert('Please Verify your Email Address to Place an Order');
    }
};

//API to fetch the orders history
const orderHistory = async () => {
  const user = await auth0.getUser();
  try {
    const token = await auth0.getTokenSilently();
    const response = await {
      method: 'GET',
      url: `/orders/order-history`,
      headers: {authorization: `Bearer ${token}`}
    }

    const responseData = await response.json();
    const responseElement = document.getElementById("order-history-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);

    document.querySelectorAll("pre code").forEach(hljs.highlightBlock);

    eachElement(".result-block", (c) => c.classList.add("show"));
  } catch (e) {
    console.error(e);
  }
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    } else if (e.target.getAttribute("id") === "new-order") {
      e.preventDefault();
      newOrder();
    } else if (e.target.getAttribute("id") === "order-history") {
      e.preventDefault();
      orderHistory();
    }
  });

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
