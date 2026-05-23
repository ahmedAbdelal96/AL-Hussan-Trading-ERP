````md
# PostgreSQL Connection via pgAdmin over SSH Tunnel

## SSH Tunnel command

Run this on your laptop:

```bash
ssh -N -L 5433:172.18.0.2:5432 root@187.124.169.98
````

Keep this terminal window open while using pgAdmin.

---

## pgAdmin connection settings

Use these values in pgAdmin:

* **Name:** ERP Production
* **Host name/address:** 127.0.0.1
* **Port:** 5433
* **Maintenance database:** erp_db
* **Username:** postgres
* **Password:** your PostgreSQL password

---

## Check PostgreSQL container on the server

Run this on the server:

```bash
docker ps --filter name=erp-postgres
```

```
```
