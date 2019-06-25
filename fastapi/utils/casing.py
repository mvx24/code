"""
A variety of functions for converting to and from camelCase and snake_case.
"""


def snake_to_camel_case(string):
    words = [word.capitalize() for word in string.split("_")]
    words[0] = words[0].lower()
    return "".join(words)


def camel_to_snake_case(string):
    words = []
    start_index = 0
    for index, c in enumerate(string):
        # Ignore the first character regardless of case
        if c.isupper() and index:
            words.append(string[start_index:index].lower())
            start_index = index
    words.append(string[start_index:].lower())
    return "_".join(words)


def camel_case_dict(data, remove=False):
    for key in list(data.keys()):
        if key.find("_") > 0:
            data[snake_to_camel_case(key)] = data[key]
            if remove:
                del data[key]


def snake_case_dict(data, remove=False):
    for key in list(data.keys()):
        sc_key = camel_to_snake_case(key)
        if sc_key != key:
            data[sc_key] = data[key]
            if remove:
                del data[key]
