from app import settings


class CommonQueryParams:
    def __init__(
        self,
        q: str = None,
        order_by: str = None,
        page: int = None,
        page_size: int = None,
    ):
        self.q = q
        self.order_by = order_by
        self.page = page
        if page_size and page_size > settings.MAX_PAGE_SIZE:
            page_size = settings.MAX_PAGE_SIZE
        self.page_size = page_size
        if isinstance(page, int) or isinstance(page_size, int):
            page = page or 0
            page_size = page_size or settings.DEFAULT_PAGE_SIZE
            self.start = page * page_size
            self.stop = self.start + page_size
        else:
            self.start = None
            self.stop = None
