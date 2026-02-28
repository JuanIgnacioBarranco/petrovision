# ============================================================
# PetroVision — InfluxDB Client (Time-Series Data)
# ============================================================

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from app.core.config import get_settings

settings = get_settings()

_client: InfluxDBClient | None = None
_write_api = None
_query_api = None


def get_influx_client() -> InfluxDBClient:
    global _client
    if _client is None:
        _client = InfluxDBClient(
            url=settings.INFLUXDB_URL,
            token=settings.INFLUXDB_TOKEN,
            org=settings.INFLUXDB_ORG,
        )
    return _client


def get_write_api():
    global _write_api
    if _write_api is None:
        _write_api = get_influx_client().write_api(write_options=SYNCHRONOUS)
    return _write_api


def get_query_api():
    global _query_api
    if _query_api is None:
        _query_api = get_influx_client().query_api()
    return _query_api


def write_sensor_reading(
    measurement: str,
    tag: str,
    value: float,
    process_id: str,
    area: str,
    quality: str = "GOOD",
):
    """Write a single sensor reading to InfluxDB."""
    point = (
        Point(measurement)
        .tag("instrument", tag)
        .tag("process", process_id)
        .tag("area", area)
        .tag("quality", quality)
        .field("value", float(value))
    )
    get_write_api().write(bucket=settings.INFLUXDB_BUCKET, record=point)


def query_sensor_history(
    tag: str,
    time_range: str = "-1h",
    downsample: str | None = None,
) -> list[dict]:
    """Query historical sensor data from InfluxDB."""
    bucket = settings.INFLUXDB_BUCKET
    flux = f'''
        from(bucket: "{bucket}")
        |> range(start: {time_range})
        |> filter(fn: (r) => r["instrument"] == "{tag}")
    '''
    if downsample:
        flux += f'''
        |> aggregateWindow(every: {downsample}, fn: mean, createEmpty: false)
        '''
    flux += '|> sort(columns: ["_time"])'

    result = get_query_api().query(flux)
    readings = []
    for table in result:
        for record in table.records:
            readings.append({
                "time": record.get_time().isoformat(),
                "value": record.get_value(),
                "instrument": record.values.get("instrument"),
            })
    return readings


def close_influx():
    global _client, _write_api, _query_api
    if _client:
        _client.close()
        _client = None
        _write_api = None
        _query_api = None
