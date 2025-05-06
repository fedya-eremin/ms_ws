const kc = new Keycloak({
  url: "http://localhost:8090",
  realm: "master",
  clientId: "app",
  checkLoginIframe: false,
});

const authInit = async () => {
  try {
    const authenticated = await kc.init();
    if (authenticated) {
      console.log("User is authenticated");
    } else {
      console.log("User is not authenticated");
    }
  } catch (error) {
    console.error("Failed to initialize adapter:", error);
  }
};

authInit();
