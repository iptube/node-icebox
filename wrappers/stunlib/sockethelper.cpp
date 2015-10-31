/* -*- Mode:C++; c-file-style:"gnu"; indent-tabs-mode:nil; -*- */

#include "sockethelper.hpp"

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <ctype.h>
#include <netdb.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include <sockaddr_util.h>


int
getSockaddrFromFqdn(struct sockaddr* addr_out,
                    const char* fqdn,
                    unsigned int port)
{
  struct addrinfo hints, * res, * p;
  int             status;

  memset(&hints, 0, sizeof hints);
  hints.ai_family   = AF_UNSPEC; /* AF_INET or AF_INET6 to force version */
  hints.ai_socktype = SOCK_STREAM;

  if ( ( status = getaddrinfo(fqdn, NULL, &hints, &res) ) != 0 )
  {
    fprintf( stderr, "getaddrinfo: %s\n", gai_strerror(status) );
    return 2;
  }

  for (p = res; p != NULL; p = p->ai_next)
  {
    /* get the pointer to the address itself, */
    /* different fields in IPv4 and IPv6: */
    if (p->ai_family == AF_INET)       /* IPv4 */
    {
      struct sockaddr_in* ipv4 = (struct sockaddr_in*)p->ai_addr;
      if (ipv4->sin_port == 0)
      {
        sockaddr_initFromIPv4Int( (struct sockaddr_in*)addr_out,
                                  ipv4->sin_addr.s_addr,
                                  htons(port) );
      }
    }
    else         /* IPv6 */
    {
      struct sockaddr_in6* ipv6 = (struct sockaddr_in6*)p->ai_addr;
      if (ipv6->sin6_port == 0)
      {
        sockaddr_initFromIPv6Int( (struct sockaddr_in6*)addr_out,
                                  ipv6->sin6_addr.s6_addr,
                                  htons(port) );
      }
    }
  }

  freeaddrinfo(res);   /* free the linked list */
  return 0;
}
