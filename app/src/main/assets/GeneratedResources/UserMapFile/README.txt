GeoJSON file format instructions in Forguncy Map Chart refers to the following link:
https://tools.ietf.org/html/rfc7946

We support two GeoJSON format: Point and Polygon as following, and the "name" property is necessary in GeoJSON file. And Point GeoJSON file must end with "_point.json", the Polygon GeoJSON file must end with "_area.json".
Point GeoJSON format sample:
{
    "geometry": 
    {
        "type": "Point",
        "coordinates": [102.0, 0.5]
    },
    "properties":
    {
        "name": "Point_A"
    }
}
Polygon GeoJSON format sample:
{
    "geometry": 
    {
        "type": "Polygon",
        "coordinates": [
	    [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0]
            ]
	]
    },
    "properties":
    {
        "name": "Area_A"
    }
}