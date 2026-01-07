---
title: Making a Home Lab!
description: How I made my home lab!
pubDate: Oct 23 2025
---

# Making a Home Lab!

Hello everyone in todays blog I will show you how I made my own Home Lab.

The main reason for making a home lab for me, was to have my own [RSS](https://en.wikipedia.org/wiki/RSS) reader that I could self host.

First I went to [awesome-selfhosted](https://awesome-selfhosted.net/) for some inspiration, after a a few hours I decided on [Glance](https://github.com/glanceapp/glance), an open source and self hosting dashboard that puts all my feeds in one place. I went through the [Installation Guide](https://github.com/glanceapp/glance?tab=readme-ov-file#installation). I chose to use Docker as it the most simple and straightforward to setup for my needs, as I won't be changing the source.

After this I started configuring the dashboard by adding RSS feeds, configuring twitch channels, HN, Lobster(HN and Lobster are in glance by default) and adding channels I most watch. For configuring the channel you have to provide the channel id, which you can access using [this turorial](https://stackoverflow.com/a/76285153).

Soon after, I realized this was not enough and spent a few more days going through a rabbit hole, what started as a simple RSS reader has now turned into 4 separate projects all hosted on a old ASUS laptop with 4GiB of RAM and 80GB of storage.

After going through [awesome-selfhosted](https://awesome-selfhosted.net/) again I found 3 more applications that I would find useful.

1.  [Homepage](https://gethomepage.dev/)
2.  [Code Server](https://github.com/coder/code-server)
3.  [Linkwarden](https://linkwarden.app/)

I chose [Homepage](https://gethomepage.dev/) for a singular page that takes you to all the other pages ie, a homepage. This is especially useful since all our URL's will be in the form of `domain/ip:port`. [Code Server](https://github.com/coder/code-server) for a Visual Studio Code instance in the web, this one was chosen specifically for it's low resource consumption. I was thinking between [Linkwarden](https://linkwarden.app/) , [Karakeep](https://karakeep.app/) and [Linkding](https://linkding.link/). Ultimately I liked the design of Karakeep and Linkwarden over Linkding and the ease of setup of Linkwarden. Also Linkwarden comes with an extenstion for [Chromium](https://en.wikipedia.org/wiki/Chromium_(web_browser)) based browsers and [Firefox(Gecko)](https://en.wikipedia.org/wiki/Gecko_(software)) based browsers.

Homepage
--------

Homepage was a simple docker setup with a few links to all the services, here is a screenshot of how it looks:

![Homelab Image](https://hc-cdn.hel1.your-objectstorage.com/s/v3/4ab8f1816a293e4a_image.png)

The top has stats about the home lab and the search bar(uses [DuckDuckGo](https://en.wikipedia.org/wiki/DuckDuckGo)) to search based on your query. Under all of that we can see a list of all services that I am hosting.

Code Server
-----------

The code server integration included a setup script which seems to not work on Linux(Ubuntu). I did the following commands:

    mkdir code-server
    cd code-server
    nano docker-compose.yml
    

and in `nano` paste the following with some changes:

    services:    
        code-server:
        image: codercom/code-server:latest
        container_name: code-server
        environment:
          - PASSWORD=changeme # Change the password
          # Optional: mount your home directory or projects
          # - TZ=America/New_York
        volumes:
          - ./code-server:/home/coder
        ports:
          - "3003:8080" # Port
        restart: unless-stopped
    

and run

    docker compose up -d
    

and visit [https://locahost:3003](https://locahost:3003)

Uptime Kuma
-----------

Uptime Kuma was one of the easiest to setup projects that I have seen, it requires little to no configuration at all. All it took to get it up and running was to run these four commands

    mkdir uptime-kuma
    cd uptime-kuma
    curl -o compose.yaml https://raw.githubusercontent.com/louislam/uptime-kuma/master/compose.yaml
    docker compose up -d
    

and you can go and visit [http://localhost:3001](http://localhost:3001)

Linkwarden
----------

Linkwarden is one if the harder and more time taking configurations requiring multiple steps, this is the [Documentation for Installation](https://docs.linkwarden.app/self-hosting/installation). Also note for generating the `NEXTAUTH_SECRET` and `MEILI_MASTER_KEY` you need to run `openssl rand -base64 32` .

Tailscale
---------

There is still a problem though, how do I access the server outside of my local network? The answer is Tailscale. Tailscale is a free VPN that lets you route your traffic to your home router, this means that even though you are connected to a wifi somewhere else your device and browser still think that you are connected to your local network, this makes sure you can access your home lab from anywhere in the world. You can always buy a domain and host it on the **Internet** but, then you have to deal with [DDOS](https://en.wikipedia.org/wiki/Denial-of-service_attack#Distributed_DoS) and [Brute force attacks](https://en.wikipedia.org/wiki/Brute-force_attack) to prevent attackers from gaining access to your website.

There is another advantage to this, instead if memorizing the [IP address](https://en.wikipedia.org/wiki/IP_address) of the server or the Tailscale device address you can simply type in the name of the device in Tailscale for example instead of `100.x.x.x:port` it would be `deviceName:port` which makes memorizing much easier.