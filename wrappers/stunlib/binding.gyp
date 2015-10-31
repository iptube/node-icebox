{
  "targets": [
    {
      "target_name": "stunlib-wrapper",
      "sources": [ "sockethelper.cpp", "stunlib-wrapper.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        '<!@(pkg-config stunlib --cflags-only-I | sed s/-I//g)',
        '<!@(pkg-config sockaddrutil --cflags-only-I | sed s/-I//g)'
      ],
      "libraries": [
        "<!@(pkg-config stunlib --libs)",
        "<!@(pkg-config sockaddrutil --libs)"
      ]
    }
  ]
}
