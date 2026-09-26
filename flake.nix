{
  description = "A Nix-flake-based Maildog development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    rust-overlay,
  }: let
    systems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
    forEachSystem = f:
      nixpkgs.lib.genAttrs systems (
        system:
          f (import nixpkgs {
            inherit system;
            overlays = [rust-overlay.overlays.default];
          })
      );
  in {
    formatter = forEachSystem (pkgs: pkgs.alejandra);

    devShells = forEachSystem (pkgs: {
      default = pkgs.mkShell {
        packages = with pkgs; [
          (pkgs.rust-bin.stable.latest.default.override {
            extensions = [
              "rust-src"
              "rust-analyzer"
            ];
          })
          bacon
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
