import scrapy

class JobItem(scrapy.Item):
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    salary_min = scrapy.Field()
    salary_max = scrapy.Field()
    description = scrapy.Field()
    skills = scrapy.Field()
    url = scrapy.Field()
    source = scrapy.Field()
    posted_at = scrapy.Field()

class ScholarshipItem(scrapy.Item):
    title = scrapy.Field()
    organization = scrapy.Field()
    country = scrapy.Field()
    level = scrapy.Field()
    field = scrapy.Field()
    coverage = scrapy.Field()
    amount = scrapy.Field()
    deadline = scrapy.Field()
    description = scrapy.Field()
    url = scrapy.Field()
    source = scrapy.Field()
