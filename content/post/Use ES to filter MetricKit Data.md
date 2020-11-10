---
title: "Use ES to filter MetricKit Data"
date: 2020-11-10T11:29:54+08:00
categories: ["Tutorial"]
draft: true
---

You can use the powerful tools provided by ES to search all data you want, such as to extract or convert specific data.

## Fetch Count

Use _count to query the count of the data which match the specific condition.

```swift
GET ios-metric-info/_count
{
	"query": {
		"match": { "appVersion" : "6.60.0" }
	}
}
```

Result:

```swift
{
  "count" : 13029357,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  }
}
```

## Query

Use the simple query to search data you want.  For example, you can query 10 pieces of MetricKit data using "match".

```swift
GET ios-metric-info/_search
{
  "query": {
    "match": { "appVersion" : "6.60.0" }
  },
  "size": 10
}
```

Result: 

```swift
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : 0.10852852,
    "hits" : [
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "2193116505974141087",
        "_score" : 0.10852852,
        "_source" : {
          "locationActivityMetrics" : {
            "cumulativeBestAccuracyForNavigationTime" : "0秒",
            "cumulativeBestAccuracyTime" : "0秒",
            "cumulativeHundredMetersAccuracyTime" : "0秒",
            "cumulativeNearestTenMetersAccuracyTime" : "0秒",
            "cumulativeKilometerAccuracyTime" : "0秒",
            "cumulativeThreeKilometersAccuracyTime" : "0秒"
          },
          "cellularConditionMetrics" : {
            "cellConditionTime" : {
              "histogramNumBuckets" : 3,
              "histogramValue" : {
                "0" : {
                  "bucketCount" : 1,
                  "bucketStart" : "0 bars",
                  "bucketEnd" : "0 bars"
                },
                "1" : {
                  "bucketCount" : 13,
                  "bucketStart" : "3 bars",
                  "bucketEnd" : "3 bars"
                },
                "2" : {
                  "bucketCount" : 86,
                  "bucketStart" : "4 bars",
                  "bucketEnd" : "4 bars"
                }
              }
            }
          },
          "metaData" : {
            "appBuildVersion" : "2780",
            "osVersion" : "iPhone OS 14.0.1 (18A393)",
            "regionFormat" : "CN",
            "platformArchitecture" : "arm64",
            "deviceType" : "iPhone9,2"
          },
          "gpuMetrics" : {
            "cumulativeGPUTime" : "64秒"
          },
          "memoryMetrics" : {
            "peakMemoryUsage" : "1,106,818千字节",
            "averageSuspendedMemory" : {
              "averageValue" : "228,145千字节",
              "standardDeviation" : 196103.71344280234,
              "sampleCount" : 22
            }
          },
          "applicationExitMetrics" : {
            "backgroundExitData" : {
              "cumulativeMemoryPressureExitCount" : 13
            },
            "foregroundExitData" : { }
          },
          "displayMetrics" : {
            "averagePixelLuminance" : {
              "averageValue" : "0 apl",
              "standardDeviation" : -1,
              "sampleCount" : 0
            }
          },
          "signpostMetrics" : [ ],
          "cpuMetrics" : {
            "cumulativeCPUTime" : "2,717秒",
            "cumulativeCPUInstructions" : "3,990,413,161 kiloinstructions"
          },
          "networkTransferMetrics" : {
            "cumulativeCellularDownload" : "22,665千字节",
            "cumulativeWifiDownload" : "1,233,598千字节",
            "cumulativeCellularUpload" : "1,611千字节",
            "cumulativeWifiUpload" : "44,049千字节"
          },
          "diskIOMetrics" : {
            "cumulativeLogicalWrites" : "2,331,056千字节"
          },
          "applicationLaunchMetrics" : {
            "histogrammedTimeToFirstDrawKey" : {
              "histogramNumBuckets" : 14,
              "histogramValue" : {
                "10" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,530毫秒",
                  "bucketEnd" : "1,539毫秒"
                },
                "2" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,260毫秒",
                  "bucketEnd" : "1,269毫秒"
                },
                "3" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,330毫秒",
                  "bucketEnd" : "1,339毫秒"
                },
                "11" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,610毫秒",
                  "bucketEnd" : "1,619毫秒"
                },
                "4" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,340毫秒",
                  "bucketEnd" : "1,349毫秒"
                },
                "5" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,360毫秒",
                  "bucketEnd" : "1,369毫秒"
                },
                "12" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,670毫秒",
                  "bucketEnd" : "1,679毫秒"
                },
                "6" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,380毫秒",
                  "bucketEnd" : "1,389毫秒"
                },
                "13" : {
                  "bucketCount" : 1,
                  "bucketStart" : "2,070毫秒",
                  "bucketEnd" : "2,079毫秒"
                },
                "7" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,390毫秒",
                  "bucketEnd" : "1,399毫秒"
                },
                "0" : {
                  "bucketCount" : 1,
                  "bucketStart" : "820毫秒",
                  "bucketEnd" : "829毫秒"
                },
                "8" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,420毫秒",
                  "bucketEnd" : "1,429毫秒"
                },
                "1" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,230毫秒",
                  "bucketEnd" : "1,239毫秒"
                },
                "9" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,500毫秒",
                  "bucketEnd" : "1,509毫秒"
                }
              }
            },
            "histogrammedResumeTime" : {
              "histogramNumBuckets" : 8,
              "histogramValue" : {
                "7" : {
                  "bucketCount" : 1,
                  "bucketStart" : "1,190,070毫秒",
                  "bucketEnd" : "1,190,079毫秒"
                },
                "3" : {
                  "bucketCount" : 1,
                  "bucketStart" : "270毫秒",
                  "bucketEnd" : "279毫秒"
                },
                "4" : {
                  "bucketCount" : 1,
                  "bucketStart" : "440毫秒",

// ...
```

## More Specific Query

The fact you must have noticed is that the data we retrieved above contains the complete JSON data.

Sometimes we only care about part of data. No worry, you can use query to define which source you want to extract. Like the syntax below, you can retrieve only the peakMemoryUsage you want. 

```swift
GET ios-metric-info/_search
{
  "query": {
    "match": { "appVersion" : "6.60.0" }
  },
  "_source": "memoryMetrics.peakMemoryUsage", 
  "size": 10
}
```

Result

```swift
{
  "took" : 7183,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : 0.10804136,
    "hits" : [
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "2193116505974141087",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "1,106,818千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "8202678354266180456",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "1,689,123千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "9203704090975753094",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "1,057,586千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "-5553106637277603205",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "354,033千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "1615561411971982176",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "378,225千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "-4291957807791526219",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "1,024,018千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "-7853877023470435346",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "270,753千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "4448994244038111894",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "181,393千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "4863857261825330976",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "92,097千字节"
          }
        }
      },
      {
        "_index" : "ios-metric-info",
        "_type" : "ios-metric-info-doc",
        "_id" : "254377352412239251",
        "_score" : 0.10804136,
        "_source" : {
          "memoryMetrics" : {
            "peakMemoryUsage" : "987,042千字节"
          }
        }
      }
    ]
  }
}
```

## Use Script to extract number from string in ES

If you have already lots of data in the ES, you do not want to change the input and reset all data you have. The scriptable variable is definitely what you want. You can use script to map existing variables to whatever you want. For example, some variable of metricKit data we have collected is plain string with some annoying unit description and some unexpected chars in the string either. We can use simple java-like script to map this variable.

MetricKit JSON data provided by Apple contains unit information shown below. The snippet is from the Apple's JSON raw representation which is actually what we want.

```swift
{
    // xxxxxxx
	  "applicationTimeMetrics" : {
    "cumulativeForegroundTime" : "1,456秒",
    "cumulativeBackgroundTime" : "347秒",
    "cumulativeBackgroundAudioTime" : "0秒",
    "cumulativeBackgroundLocationTime" : "0秒"
  },
  "timeStampEnd" : "2020-10-24 22:59:00 +0000",
  "appVersion" : "6.60.0",
  "timeStampBegin" : "2020-10-23 23:00:00 +0000",
  "uploadTimeUTC" : "2020-10-30T00:00:41.467108"
	// xxxxxxx
}
```

No worry, like the script shows below, you can define a scriptable variable to add a custom variable which map 

```swift
GET ios-metric-info/_search
{
  "query": {
    "match": { "appVersion" : "6.60.0" }
  },
  "aggs": {
    "cumulativeForegroundTimeAverage": {
      "avg": {
        "script" : "try { String str = doc['applicationTimeMetrics.cumulativeForegroundTime.keyword'].value.replace(\"秒\", \"\"); return Integer.parseInt(str); } catch (NumberFormatException e) { return 0; }"
      }
    }
  }
}
```

The definition of aggregation is defined like below.

```swift
"aggs": {
	  // New name for the agg
    "NAME": {
      "AGG_TYPE": {}
    }
}
```

Then when search the expect aggregation you want, ES will query data and aggregate them for you through the defined rules.