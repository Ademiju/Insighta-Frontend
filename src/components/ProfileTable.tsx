import { useNavigate } from 'react-router-dom'

export default function ProfileTable({ rows }: any) {
    const navigate = useNavigate()

    return (
        <table>
            <tbody>
            {rows.map((p: any) => (
                <tr key={p.id} onClick={() => navigate(`/profiles/${p.id}`)}>
                    <td>{p.name}</td>
                    <td>{p.gender}</td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}