# backend/app/utils/command_types.py
NORMALIZED_COMMAND_TYPES = {"@", "$", "#", "*"}
STAR_UNICODE = "\u2731"


def normalize_command_type(cmd: str) -> str:
    if cmd == STAR_UNICODE:
        return "*"
    if cmd in NORMALIZED_COMMAND_TYPES:
        return cmd
    return "default"