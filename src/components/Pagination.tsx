export default function Pagination({ page, totalPages, onPage }: any) {
    return (
        <div className="pagination">
            <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
        </div>
    )
}