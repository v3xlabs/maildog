{
  description = "A Nix-flake-based Maildog development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs {
          inherit system;
        };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            openssl
            pkg-config
            bashInteractive

            jq
            envsubst
            softhsm
            gnutls
            xxd
            nodejs
            nodePackages.prettier
            sccache
            
            # D-Bus development libraries
            dbus
            dbus.dev
          ];

          shellHook = ''
            source scripts/dev.sh
            # Disable SCCache if enabled
            unset RUSTC_WRAPPER
            # get current directory
            export CURRENT_DIR=$(pwd)
            export DATABASE_URL=sqlite://$CURRENT_DIR/database.db
          '';
        };
      });
    };
}
