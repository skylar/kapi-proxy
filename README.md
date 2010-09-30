# kapi-proxy: node.js Kiva API proxy

This is a small node-based proxy to help re-munge and cache data from the Kiva API (http://build.kiva.org/) in a way that helps RIAs and similar client-heavy applications.

Some notes:

* Currently, only one operation is supported. All incoming requests return the list of Loan IDs of loans currently raising funds, ordered from newest to oldest. Clients can then use this list to grab more loan details from the Kiva API directly.

* Set to run on port 5482. Avoiding privileged ports make using simple for now.

* This is highly experimental. The code probably isn't secure or highly-performant. Use at your own risk.

Future possible features:

* Cached translations of loan descriptions via Google Translate

* Caching loan objects for mass-import by clients (eg, fetch all Loan objects for fundraising loans)

* Pass-through proxy for Kiva API requests (eg, run your own server to proxy API calls w/ same-domain policy)

