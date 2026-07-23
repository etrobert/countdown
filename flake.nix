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

      # Shared across the package build and the eslint check: both need the full
      # pnpm dependency set (dev deps included) fetched from the same lockfile.
      pnpmDepsHash = "sha256-UEx4y8uDV3wDPxu0I5j8QQPeqGDDhE3Jgcx7FqIr26M=";
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
              hash = pnpmDepsHash;
            };

            buildPhase = ''
              pnpm build
            '';

            installPhase = ''
              cp -r dist $out
            '';
          });
        }
      );

      checks = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          eslint = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "countdown-eslint";
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
              hash = pnpmDepsHash;
            };

            buildPhase = ''
              pnpm lint
            '';

            installPhase = ''
              touch $out
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
