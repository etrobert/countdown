{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "countdown";
            version = "0.0.0";
            src = ./.;

            nativeBuildInputs = [
              pkgs.nodejs
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 4;
              hash = "sha256-pQG/7ERxCgn6+7hl2TMbXMXzHumSf+VNoNN16oWjuEY=";
            };

            # Run the unit tests before building, so `nix build` (and CI) fails
            # on a red suite.
            doCheck = true;

            checkPhase = ''
              pnpm test
            '';

            buildPhase = ''
              pnpm build
            '';

            installPhase = ''
              cp -r dist $out
            '';
          });
        }
      );

      # Static site deployment: Caddy serves the built dist directly. The
      # domain is a consumer option so the project isn't bound to any one host.
      nixosModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          inherit (pkgs.stdenv.hostPlatform) system;
          cfg = config.services.countdown;
        in
        {
          options.services.countdown = {
            enable = lib.mkEnableOption "the Countdown static site";

            hostName = lib.mkOption {
              type = lib.types.str;
              example = "countdown.example.com";
              description = "Domain Caddy serves Countdown on.";
            };
          };

          config = lib.mkIf cfg.enable {
            services.caddy = {
              enable = true;
              virtualHosts.${cfg.hostName}.extraConfig = /* caddy */ ''
                root * ${self.packages.${system}.default}
                file_server
              '';
            };
          };
        };

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs
              pkgs.pnpm
              pkgs.zip
            ];
          };
        }
      );
    };
}
