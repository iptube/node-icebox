/* -*- Mode:C++; c-file-style:"gnu"; indent-tabs-mode:nil; -*- */

#ifndef SOCKETHELPER_HPP
#define SOCKETHELPER_HPP

int
getSockaddrFromFqdn(struct sockaddr* addr_out,
                    const char*      fqdn,
                    unsigned int port);

#endif // SOCKETHELPER_HPP
