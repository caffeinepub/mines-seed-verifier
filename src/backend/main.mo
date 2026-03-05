actor {
  type AppInfo = {
    name : Text;
    version : Text;
    description : Text;
  };

  public query ({ caller }) func ping() : async Text {
    "ok";
  };

  public query ({ caller }) func getAppInfo() : async AppInfo {
    {
      name = "Mines Seed Verifier";
      version = "1.0.0";
      description = "Provably fair mines verifier";
    };
  };
};
